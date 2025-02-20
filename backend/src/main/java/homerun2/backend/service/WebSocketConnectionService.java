package homerun2.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WebSocketConnectionService {

    private final ChatService chatService;

    @Transactional
    public void handleUserConnection(Long userId) {
        chatService.handleUserConnection(userId);
    }

    @Transactional
    public void handleUserDisconnection(Long userId) {
        chatService.handleUserDisconnection(userId);
    }

    @Transactional
    public void handleConnectionError(Long userId, String errorMessage) {
        // 에러 처리 및 재연결 로직
        chatService.updateUserStatus(userId, "ERROR");
        // 추가적인 에러 처리 로직을 구현할 수 있습니다
    }
}