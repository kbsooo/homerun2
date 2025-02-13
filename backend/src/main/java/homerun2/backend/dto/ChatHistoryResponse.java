package homerun2.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatHistoryResponse {
    private String id;
    private String date;
    private String roomId;
    private String lastMessage;
    private int participants;
} 