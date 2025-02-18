package homerun2.backend.controller;

import homerun2.backend.service.ChatService;
import homerun2.backend.service.JwtService;
import homerun2.backend.dto.ChatHistoryResponse;
import homerun2.backend.dto.ChatMessageResponse;
import homerun2.backend.dto.ErrorResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final JwtService jwtService;

    @GetMapping("/histories")
    public ResponseEntity<?> getChatHistories(@RequestHeader(value = "Authorization", required = false) String token) {
        try {
            log.info("Received request for chat histories with token: {}", token);

            if (token == null || !token.startsWith("Bearer ")) {
                log.warn("Invalid token format received: {}", token);
                return ResponseEntity.status(403)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(new ErrorResponse("로그인이 필요합니다."));
            }

            String actualToken = token.substring(7);
            log.info("Extracted token: {}", actualToken);

            try {
                Claims claims = jwtService.validateToken(actualToken);
                Long userId = Long.parseLong(claims.getSubject());
                log.info("Validated token for user ID: {}", userId);

                List<ChatHistoryResponse> histories = chatService.getChatHistories(userId);
                if (histories == null) {
                    histories = Collections.emptyList();
                }
                log.info("Retrieved {} chat histories", histories.size());

                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(histories);
            } catch (ExpiredJwtException e) {
                log.warn("Token has expired: {}", e.getMessage());
                return ResponseEntity.status(403)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(new ErrorResponse("로그인이 만료되었습니다. 다시 로그인해주세요."));
            } catch (JwtException e) {
                log.error("Token validation failed: {}", e.getMessage());
                return ResponseEntity.status(403)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(new ErrorResponse("유효하지 않은 인증입니다. 다시 로그인해주세요."));
            }
        } catch (Exception e) {
            log.error("Error while fetching chat histories: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new ErrorResponse("채팅 기록을 불러오는데 실패했습니다."));
        }
    }

    @GetMapping("/{chatRoomId}")
    public ResponseEntity<?> getChatMessages(
            @PathVariable Long chatRoomId,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            log.debug("Received request for chat messages. ChatRoomId: {}", chatRoomId);

            if (token == null || !token.startsWith("Bearer ")) {
                log.warn("Invalid token format received: {}", token);
                return ResponseEntity.status(403)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(new ErrorResponse("로그인이 필요합니다."));
            }

            String actualToken = token.substring(7);
            log.debug("Extracted token: {}", actualToken);

            try {
                Claims claims = jwtService.validateToken(actualToken);
                Long userId = Long.parseLong(claims.getSubject());
                log.debug("Validated token for user ID: {}", userId);

                List<ChatMessageResponse> messages = chatService.getChatMessages(chatRoomId);
                if (messages == null) {
                    messages = Collections.emptyList();
                }
                log.debug("Retrieved {} messages for chat room {}", messages.size(), chatRoomId);

                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(messages);
            } catch (ExpiredJwtException e) {
                log.warn("Token has expired: {}", e.getMessage());
                return ResponseEntity.status(403)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(new ErrorResponse("로그인이 만료되었습니다. 다시 로그인해주세요."));
            } catch (JwtException e) {
                log.error("Token validation failed: {}", e.getMessage());
                return ResponseEntity.status(403)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(new ErrorResponse("유효하지 않은 인증입니다. 다시 로그인해주세요."));
            }
        } catch (Exception e) {
            log.error("Error while fetching chat messages: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new ErrorResponse("메시지를 불러오는데 실패했습니다."));
        }
    }
}