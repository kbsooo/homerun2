package homerun2.backend.service;

import homerun2.backend.entity.ChatRoom;
import homerun2.backend.entity.ChatMessage;
import homerun2.backend.repository.ChatRoomRepository;
import homerun2.backend.repository.ChatMessageRepository;
import homerun2.backend.dto.ChatHistoryResponse;
import homerun2.backend.dto.ChatMessageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

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
}