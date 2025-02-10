package homerun2.backend.service;

import homerun2.backend.model.TaxiChatMessage;
import homerun2.backend.repository.TaxiChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaxiChatService {
    private final TaxiChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void sendMessage(TaxiChatMessage message) {
        TaxiChatMessage savedMessage = chatMessageRepository.save(message);
        messagingTemplate.convertAndSend(
                "/topic/chat/" + message.getGroupId(),
                savedMessage);
    }

    public List<TaxiChatMessage> getChatHistory(String groupId) {
        return chatMessageRepository.findByGroupIdOrderByTimestampAsc(groupId);
    }
}