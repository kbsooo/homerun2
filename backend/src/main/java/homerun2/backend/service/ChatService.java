package homerun2.backend.service;

import homerun2.backend.entity.ChatRoom;
import homerun2.backend.entity.ChatMessage;
import homerun2.backend.repository.ChatRoomRepository;
import homerun2.backend.repository.ChatMessageRepository;
import homerun2.backend.dto.ChatHistoryResponse;
import homerun2.backend.dto.ChatMessageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Transactional(readOnly = true)
    public List<ChatHistoryResponse> getChatHistories(Long userId) {
        List<ChatRoom> chatRooms = chatRoomRepository.findAllByUserId(userId);
        return chatRooms.stream()
                .map(this::toChatHistoryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getChatMessages(Long chatRoomId) {
        List<ChatMessage> messages = chatMessageRepository.findByChatRoomIdOrderByCreatedAtAsc(chatRoomId);
        return messages.stream()
                .map(this::toChatMessageResponse)
                .collect(Collectors.toList());
    }

    private ChatHistoryResponse toChatHistoryResponse(ChatRoom chatRoom) {
        return ChatHistoryResponse.builder()
                .id(chatRoom.getId().toString())
                .date(chatRoom.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
                .roomId(chatRoom.getId().toString())
                .lastMessage(chatRoom.getLastMessage())
                .participants(3) // TODO: 실제 참여자 수 계산
                .build();
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId().toString())
                .sender(message.getSenderNickname())
                .content(message.getContent())
                .time(message.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")))
                .build();
    }
}