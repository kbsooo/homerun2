package homerun2.backend.config;

import homerun2.backend.service.WebSocketConnectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@RequiredArgsConstructor
public class WebSocketConfig {

    private static final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);
    private final WebSocketConnectionService connectionService;

    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                String userId = accessor.getFirstNativeHeader("userId");

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    handleConnect(userId);
                } else if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
                    handleDisconnect(userId);
                } else if (StompCommand.ERROR.equals(accessor.getCommand())) {
                    handleError(userId, accessor.getMessage());
                }

                return message;
            }
        });
    }

    private void handleConnect(String userId) {
        if (userId != null) {
            connectionService.handleUserConnection(Long.parseLong(userId));
        }
    }

    private void handleDisconnect(String userId) {
        if (userId != null) {
            connectionService.handleUserDisconnection(Long.parseLong(userId));
        }
    }

    private void handleError(String userId, String errorMessage) {
        if (userId != null) {
            log.error("WebSocket error for user {}: {}", userId, errorMessage);
            connectionService.handleConnectionError(Long.parseLong(userId), errorMessage);
        }
    }
}