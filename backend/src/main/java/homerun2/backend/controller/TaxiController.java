package homerun2.backend.controller;

import homerun2.backend.model.TaxiChatMessage;
import homerun2.backend.model.TaxiGroup;
import homerun2.backend.service.TaxiChatService;
import homerun2.backend.service.TaxiGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/taxi")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class TaxiController {
    private final TaxiGroupService taxiGroupService;
    private final TaxiChatService taxiChatService;

    @PostMapping("/join")
    public ResponseEntity<TaxiGroup> joinGroup(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String destination) {
        String token = authHeader.replace("Bearer ", "");
        TaxiGroup group = taxiGroupService.joinOrCreateGroup(token, destination);
        return ResponseEntity.ok(group);
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<TaxiGroup> getGroup(@PathVariable String groupId) {
        TaxiGroup group = taxiGroupService.getGroupById(groupId);
        return ResponseEntity.ok(group);
    }

    @GetMapping("/chat/{groupId}")
    public ResponseEntity<List<TaxiChatMessage>> getChatHistory(@PathVariable String groupId) {
        List<TaxiChatMessage> messages = taxiChatService.getChatHistory(groupId);
        return ResponseEntity.ok(messages);
    }

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload TaxiChatMessage message) {
        taxiChatService.sendMessage(message);
    }

    @GetMapping("/count/{destination}")
    public ResponseEntity<Map<String, Integer>> getGroupCount(@PathVariable String destination) {
        taxiGroupService.updateGroupCount(destination);
        return ResponseEntity.ok(Map.of("count", 0)); // Count will be updated via WebSocket
    }
}