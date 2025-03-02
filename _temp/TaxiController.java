package com.example.taxi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/taxi")
public class TaxiController {

    @PostMapping("/leave")
    public ResponseEntity<?> leaveAllGroups(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            int groupsLeft = taxiGroupService.leaveAllGroups(token);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Successfully left " + groupsLeft + " groups"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }
} 