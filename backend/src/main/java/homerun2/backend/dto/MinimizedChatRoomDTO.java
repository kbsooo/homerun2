package homerun2.backend.dto;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class MinimizedChatRoomDTO {
    private Long chatRoomId;
    private String lastMessage;
    private int unreadCount;
    private LocalDateTime minimizedAt;
}