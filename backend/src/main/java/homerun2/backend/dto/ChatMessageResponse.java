package homerun2.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatMessageResponse {
    private String id;
    private String sender;
    private String content;
    private String time;
} 