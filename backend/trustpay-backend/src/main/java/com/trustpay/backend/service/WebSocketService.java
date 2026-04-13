package com.trustpay.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendClaimStep(String claimId, int step, String status, String detail, String subDetail) {
        Map<String, Object> payload = Map.of(
            "claimID", claimId,
            "step", step,
            "status", status,
            "detail", detail,
            "subDetail", subDetail
        );
        
        // Topic: /topic/claims/{claimId} or /topic/user/{userId}/claims
        // For simplicity, we can use a per-user topic
        log.info("Sending claim step {} for claim {}: {}", step, claimId, detail);
        messagingTemplate.convertAndSend("/topic/claim/" + claimId, payload);
    }

    public void sendAIResult(String claimId, Object aiResult) {
        Map<String, Object> payload = Map.of(
            "claimID", claimId,
            "aiResult", aiResult
        );
        messagingTemplate.convertAndSend("/topic/claim/" + claimId + "/result", payload);
    }
}
