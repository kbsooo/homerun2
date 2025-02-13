package homerun2.backend.controller;

import homerun2.backend.service.ChatService;
import homerun2.backend.dto.ChatHistoryResponse;
import homerun2.backend.dto.ChatMessageResponse;
import homerun2.backend.dto.ErrorResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
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

    @GetMapping("/histories")
    public ResponseEntity<?> getChatHistories(@RequestHeader("Authorization") String token) {
        try {
            log.info("Received request for chat histories with token: {}", token);

            if (!token.startsWith("Bearer ")) {
                log.warn("Invalid token format received");
                return ResponseEntity.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(new ErrorResponse("Invalid token format"));
            }

            String actualToken = token.substring(7);
            // TODO: token에서 userId 추출
            Long userId = 1L; // 임시로 고정된 userId 사용

            List<ChatHistoryResponse> histories = chatService.getChatHistories(userId);
            log.info("Returning {} chat histories", histories != null ? histories.size() : 0);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // 빈 리스트라도 정상적인 JSON 배열로 반환
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(histories != null ? histories : Collections.emptyList());
        } catch (Exception e) {
            log.error("Error while fetching chat histories", e);
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new ErrorResponse("채팅 기록을 불러오는데 실패했습니다: " + e.getMessage()));
        }
    }

    @GetMapping("/messages/{chatRoomId}")
    public ResponseEntity<?> getChatMessages(
            @PathVariable Long chatRoomId,
            @RequestHeader("Authorization") String token) {
        try {
            log.info("Received request for chat messages. ChatRoomId: {}, Token: {}", chatRoomId, token);

            if (!token.startsWith("Bearer ")) {
                log.warn("Invalid token format received");
                return ResponseEntity.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(new ErrorResponse("Invalid token format"));
            }

            String actualToken = token.substring(7);
            // TODO: token 검증

            List<ChatMessageResponse> messages = chatService.getChatMessages(chatRoomId);
            log.info("Returning {} messages for chat room {}", messages != null ? messages.size() : 0, chatRoomId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // 빈 리스트라도 정상적인 JSON 배열로 반환
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(messages != null ? messages : Collections.emptyList());
        } catch (Exception e) {
            log.error("Error while fetching chat messages", e);
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new ErrorResponse("메시지를 불러오는데 실패했습니다: " + e.getMessage()));
        }
    }
}