package homerun2.backend.service;

import homerun2.backend.entity.ChatRoom;
import homerun2.backend.entity.ChatMessage;
import homerun2.backend.entity.MessageReadStatus;
import homerun2.backend.entity.ChatRoomMember;
import homerun2.backend.repository.ChatRoomRepository;
import homerun2.backend.repository.ChatMessageRepository;
import homerun2.backend.repository.MessageReadStatusRepository;
import homerun2.backend.repository.ChatRoomMemberRepository;
import homerun2.backend.dto.ChatHistoryResponse;
import homerun2.backend.dto.ChatMessageResponse;
import homerun2.backend.dto.MinimizedChatRoomDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.Set;
import java.util.Objects;
import java.util.concurrent.ConcurrentSkipListSet;
import lombok.Data;
import lombok.AllArgsConstructor;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MessageReadStatusRepository messageReadStatusRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private final Map<Long, UserStatus> userStatusMap = new ConcurrentHashMap<>();
    private final Map<Long, Set<MinimizedChatRoom>> userMinimizedChats = new ConcurrentHashMap<>();
    private final Map<Long, Long> userActiveChatRooms = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public List<ChatHistoryResponse> getChatHistories(Long userId) {
        if (userId == null) {
            log.error("Attempted to get chat histories with null userId");
            return Collections.emptyList();
        }

        try {
            log.debug("Fetching chat histories for user: {}", userId);
            List<ChatRoom> chatRooms = chatRoomRepository.findAllByUserId(userId);

            return chatRooms.stream()
                    .map(this::toChatHistoryResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching chat histories for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getChatMessages(Long chatRoomId) {
        if (chatRoomId == null) {
            log.error("Attempted to get chat messages with null chatRoomId");
            return Collections.emptyList();
        }

        try {
            log.debug("Fetching chat messages for room: {}", chatRoomId);
            List<ChatMessage> messages = chatMessageRepository.findByChatRoomIdOrderByCreatedAtAsc(chatRoomId);

            if (messages.isEmpty()) {
                log.debug("No messages found for chat room: {}", chatRoomId);
            }

            return messages.stream()
                    .map(this::toChatMessageResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching chat messages for room {}: {}", chatRoomId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private ChatHistoryResponse toChatHistoryResponse(ChatRoom chatRoom) {
        if (chatRoom == null) {
            log.warn("Attempted to convert null ChatRoom to ChatHistoryResponse");
            return null;
        }

        try {
            return ChatHistoryResponse.builder()
                    .id(chatRoom.getId().toString())
                    .date(chatRoom.getCreatedAt().format(DATE_FORMATTER))
                    .roomId(chatRoom.getId().toString())
                    .lastMessage(chatRoom.getLastMessage())
                    .participants(chatRoom.getParticipantCount())
                    .build();
        } catch (Exception e) {
            log.error("Error converting ChatRoom to ChatHistoryResponse: {}", e.getMessage());
            return null;
        }
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage message) {
        if (message == null) {
            log.warn("Attempted to convert null ChatMessage to ChatMessageResponse");
            return null;
        }

        try {
            return ChatMessageResponse.builder()
                    .id(message.getId().toString())
                    .sender(message.getSenderNickname())
                    .content(message.getContent())
                    .time(message.getCreatedAt().format(TIME_FORMATTER))
                    .build();
        } catch (Exception e) {
            log.error("Error converting ChatMessage to ChatMessageResponse: {}", e.getMessage());
            return null;
        }
    }

    @Transactional
    public ChatMessageResponse saveAndProcessMessage(ChatMessage message) {
        if (message == null || message.getChatRoom() == null) {
            log.error("Attempted to save null message or message with null chat room");
            return null;
        }

        try {
            // Update message metadata
            message.setCreatedAt(LocalDateTime.now());

            // Save the message
            ChatMessage savedMessage = chatMessageRepository.save(message);

            // Update chat room's last message and time
            ChatRoom chatRoom = message.getChatRoom();
            chatRoom.setLastMessage(message.getContent());
            chatRoom.setUpdatedAt(LocalDateTime.now());
            chatRoomRepository.save(chatRoom);

            // Create read status entries for all participants
            createReadStatusEntries(savedMessage);

            return toChatMessageResponse(savedMessage);
        } catch (Exception e) {
            log.error("Error saving and processing message: {}", e.getMessage(), e);
            return null;
        }
    }

    private void createReadStatusEntries(ChatMessage message) {
        ChatRoom chatRoom = message.getChatRoom();
        List<Long> participants = chatRoom.getParticipants();

        participants.forEach(userId -> {
            MessageReadStatus readStatus = new MessageReadStatus();
            readStatus.setMessage(message);
            readStatus.setUserId(userId);
            readStatus.setRead(userId.equals(message.getUserId())); // Mark as read for sender
            readStatus.setReadAt(userId.equals(message.getUserId()) ? LocalDateTime.now() : null);
            messageReadStatusRepository.save(readStatus);
        });
    }

    @Transactional
    public void markMessageAsRead(Long messageId, Long userId) {
        MessageReadStatus readStatus = messageReadStatusRepository.findByMessageIdAndUserId(messageId, userId)
                .orElseThrow(() -> new IllegalStateException("Read status not found"));

        if (!readStatus.isRead()) {
            readStatus.setRead(true);
            readStatus.setReadAt(LocalDateTime.now());
            messageReadStatusRepository.save(readStatus);
        }
    }

    @Transactional(readOnly = true)
    public List<Long> getUnreadMessageIds(Long userId, Long chatRoomId) {
        return messageReadStatusRepository.findUnreadMessageIds(userId, chatRoomId);
    }

    @Transactional
    public void leaveChatRoom(Long chatRoomId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));

        // Remove user from participants
        chatRoom.getParticipants().remove(userId);

        // Update ChatRoomMember status
        ChatRoomMember member = chatRoomMemberRepository.findByChatRoomIdAndUserId(chatRoomId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room member not found"));
        member.setLeftAt(LocalDateTime.now());
        chatRoomMemberRepository.save(member);

        // If no participants left, mark room as inactive
        if (chatRoom.getParticipants().isEmpty()) {
            chatRoom.setActive(false);
        }

        chatRoomRepository.save(chatRoom);

        // Create system message about user leaving
        ChatMessage systemMessage = new ChatMessage();
        systemMessage.setChatRoom(chatRoom);
        systemMessage.setContent(String.format("User %d has left the chat", userId));
        systemMessage.setSystemMessage(true);
        saveAndProcessMessage(systemMessage);
    }

    @Transactional
    public void deleteChatRoom(Long chatRoomId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));

        // Verify user is admin or has permission to delete
        if (!isUserAdmin(userId, chatRoom)) {
            throw new IllegalStateException("User does not have permission to delete this chat room");
        }

        // Mark room as inactive
        chatRoom.setActive(false);
        chatRoomRepository.save(chatRoom);

        // Mark all members as left
        List<ChatRoomMember> members = chatRoomMemberRepository.findAllByChatRoomId(chatRoomId);
        LocalDateTime now = LocalDateTime.now();
        members.forEach(member -> {
            if (member.getLeftAt() == null) {
                member.setLeftAt(now);
                chatRoomMemberRepository.save(member);
            }
        });
    }

    private boolean isUserAdmin(Long userId, ChatRoom chatRoom) {
        // Implement your admin check logic here
        // For example, check if user is the creator or has admin role
        return chatRoom.getCreatorId().equals(userId);
    }

    @Scheduled(cron = "0 0 * * * *") // Run every hour
    @Transactional
    public void cleanupInactiveChatRooms() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(30); // Keep inactive rooms for 30 days

        // Archive messages from inactive rooms
        List<ChatRoom> inactiveRooms = chatRoomRepository.findByIsActiveFalseAndUpdatedAtBefore(cutoffTime);
        for (ChatRoom room : inactiveRooms) {
            archiveChatRoomMessages(room);
        }

        // Delete inactive rooms
        chatRoomRepository.deleteInactiveChatRoomsOlderThan(cutoffTime);
    }

    private void archiveChatRoomMessages(ChatRoom chatRoom) {
        // Implement your archiving logic here
        // For example, move messages to an archive table or export to a file
        List<ChatMessage> messages = chatMessageRepository.findByChatRoomIdOrderByCreatedAtAsc(chatRoom.getId());
        // Archive messages...
    }

    @Scheduled(fixedRate = 30000) // Check every 30 seconds
    public void checkUserStatus() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(5);
        userStatusMap.entrySet().removeIf(entry -> {
            if (entry.getValue().getLastActive().isBefore(threshold)) {
                notifyUserOffline(entry.getKey());
                return true;
            }
            return false;
        });
    }

    public void updateUserStatus(Long userId, String status) {
        UserStatus userStatus = userStatusMap.computeIfAbsent(userId, k -> new UserStatus());
        userStatus.setStatus(status);
        userStatus.setLastActive(LocalDateTime.now());

        // Notify relevant chat rooms about user status change
        List<ChatRoom> userChatRooms = findActiveChatRoomsForUser(userId);
        userChatRooms.forEach(room -> notifyRoomParticipants(room.getId(), "USER_STATUS", Map.of(
                "userId", userId,
                "status", status)));
    }

    private void notifyUserOffline(Long userId) {
        updateUserStatus(userId, "OFFLINE");
    }

    private List<ChatRoom> findActiveChatRoomsForUser(Long userId) {
        return chatRoomRepository.findActiveRoomsByUserId(userId);
    }

    private void notifyRoomParticipants(Long roomId, String eventType, Object payload) {
        messagingTemplate.convertAndSend("/topic/chat/" + roomId + "/" + eventType, payload);
    }

    @Transactional
    public void handleUserConnection(Long userId) {
        updateUserStatus(userId, "ONLINE");
    }

    @Transactional
    public void handleUserDisconnection(Long userId) {
        updateUserStatus(userId, "OFFLINE");
    }

    @Transactional
    public void minimizeChatRoom(Long userId, Long chatRoomId) {
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));

        Set<MinimizedChatRoom> minimizedChats = userMinimizedChats.computeIfAbsent(userId,
                k -> new ConcurrentSkipListSet<>((a, b) -> b.getMinimizedAt().compareTo(a.getMinimizedAt())));
        minimizedChats.add(new MinimizedChatRoom(chatRoomId, chatRoom.getLastMessage(), LocalDateTime.now()));

        // Clear active chat room when minimizing
        clearActiveChatRoom(userId);

        // Notify about minimization
        notifyRoomParticipants(chatRoomId, "CHAT_MINIMIZED", Map.of(
                "userId", userId,
                "minimized", true));
    }

    @Transactional
    public void maximizeChatRoom(Long userId, Long chatRoomId) {
        Set<MinimizedChatRoom> minimizedChats = userMinimizedChats.get(userId);
        if (minimizedChats != null) {
            minimizedChats.removeIf(chat -> chat.getChatRoomId().equals(chatRoomId));
        }

        // Set as active chat room when maximizing
        setActiveChatRoom(userId, chatRoomId);

        // Notify about maximization
        notifyRoomParticipants(chatRoomId, "CHAT_MAXIMIZED", Map.of(
                "userId", userId,
                "minimized", false));
    }

    @Transactional(readOnly = true)
    public List<MinimizedChatRoomDTO> getMinimizedChatRooms(Long userId) {
        Set<MinimizedChatRoom> minimizedChats = userMinimizedChats.getOrDefault(userId, Collections.emptySet());
        return minimizedChats.stream()
                .map(chat -> {
                    ChatRoom chatRoom = chatRoomRepository.findById(chat.getChatRoomId())
                            .orElse(null);
                    if (chatRoom == null)
                        return null;

                    return MinimizedChatRoomDTO.builder()
                            .chatRoomId(chat.getChatRoomId())
                            .lastMessage(chatRoom.getLastMessage())
                            .unreadCount(getUnreadMessageCount(userId, chat.getChatRoomId()))
                            .minimizedAt(chat.getMinimizedAt())
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private int getUnreadMessageCount(Long userId, Long chatRoomId) {
        return messageReadStatusRepository.countUnreadMessages(userId, chatRoomId);
    }

    @Data
    @AllArgsConstructor
    private static class MinimizedChatRoom {
        private Long chatRoomId;
        private String lastMessage;
        private LocalDateTime minimizedAt;
    }

    private static class UserStatus {
        private String status = "OFFLINE";
        private LocalDateTime lastActive = LocalDateTime.now();

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public LocalDateTime getLastActive() {
            return lastActive;
        }

        public void setLastActive(LocalDateTime lastActive) {
            this.lastActive = lastActive;
        }
    }

    @Transactional
    public void setActiveChatRoom(Long userId, Long chatRoomId) {
        userActiveChatRooms.put(userId, chatRoomId);
    }

    @Transactional
    public void clearActiveChatRoom(Long userId) {
        userActiveChatRooms.remove(userId);
    }

    @Transactional(readOnly = true)
    public Long getActiveChatRoomId(Long userId) {
        return userActiveChatRooms.get(userId);
    }
}