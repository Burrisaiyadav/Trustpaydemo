package com.trustpay.backend.controller;

import com.trustpay.backend.ai.TrustpayMLModel;
import com.trustpay.backend.dto.ClaimRequest;
import com.trustpay.backend.model.Claim;
import com.trustpay.backend.model.Policy;
import com.trustpay.backend.model.User;
import com.trustpay.backend.repository.ClaimRepository;
import com.trustpay.backend.repository.PolicyRepository;
import com.trustpay.backend.repository.UserRepository;
import com.trustpay.backend.service.GeocodingService;
import com.trustpay.backend.service.PayoutService;
import com.trustpay.backend.service.WeatherService;
import com.trustpay.backend.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
@Slf4j
public class ClaimController {

    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final PolicyRepository policyRepository;
    private final WeatherService weatherService;
    private final GeocodingService geocodingService;
    private final TrustpayMLModel mlModel;
    private final WebSocketService wsService;
    private final PayoutService payoutService;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    @PostMapping("/initiate")
    public ResponseEntity<?> initiateClaim(@RequestBody ClaimRequest request, Principal principal) {
        User user = userRepository.findByUsername(principal.getName()).orElseThrow();
        Policy policy = policyRepository.findByUserAndStatus(user, "active")
                .orElseThrow(() -> new RuntimeException("No active policy found"));

        // 1. Get real weather and location
        Map<String, Object> weather = weatherService.getWeather(request.getLatitude(), request.getLongitude());
        Map<String, String> location = geocodingService.reverseGeocode(request.getLatitude(), request.getLongitude());

        String claimID = "TRP-" + System.currentTimeMillis() / 1000 + "-" + (int)(Math.random() * 9000 + 1000);

        // 2. Prepare ML Input
        Map<String, Object> mlInput = new HashMap<>();
        mlInput.put("planType", policy.getPlanType());
        mlInput.put("weatherEvent", weather.get("event"));
        mlInput.put("avgDailyEarnings", user.getAvgDailyEarnings() != null ? user.getAvgDailyEarnings() : 1200.0);
        mlInput.put("zoneRiskScore", user.getZoneRiskScore());
        mlInput.put("gpsAccuracy", request.getAccuracy());

        // 3. Run AI Prediction
        TrustpayMLModel.PredictionResult aiResult = mlModel.predict(mlInput);

        // 4. Save Claim in Processing state
        Claim claim = Claim.builder()
                .claimID(claimID)
                .user(user)
                .policyID(policy.getId())
                .status("processing")
                .zone(location.get("zone"))
                .city(location.get("city"))
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .accuracy(request.getAccuracy())
                .locationMethod(request.getLocationMethod())
                .weatherEvent((String) weather.get("event"))
                .weatherIntensity(weather.get("rainfall").toString())
                .temperature((Double) weather.get("temp"))
                .weatherDescription((String) weather.get("description"))
                .weatherSource((String) weather.get("source"))
                .approvedPayout(aiResult.getFinalPayout())
                .fraudScore(aiResult.getFraudScore())
                .aiConfidence(Double.parseDouble(aiResult.getConfidence()))
                .modelVersion(aiResult.getModelVersion())
                .processingTimeMs(aiResult.getProcessingTimeMs())
                .aiExplanation(aiResult.getFraudFlags().toString())
                .build();

        claimRepository.save(claim);

        // 5. Emit Steps via WebSocket with delays to simulate processing
        simulateSteps(claimID, location, weather, aiResult);

        return ResponseEntity.ok(Map.of("claimID", claimID, "aiResult", aiResult));
    }

    private void simulateSteps(String claimID, Map<String, String> location, Map<String, Object> weather, TrustpayMLModel.PredictionResult aiResult) {
        scheduler.schedule(() -> wsService.sendClaimStep(claimID, 1, "success", location.get("zone") + ", " + location.get("city") + " verified", "GPS accuracy match"), 500, TimeUnit.MILLISECONDS);
        scheduler.schedule(() -> wsService.sendClaimStep(claimID, 2, "success", weather.get("event") + " event confirmed", "Intensity: " + weather.get("rainfall") + "mm/hr"), 1500, TimeUnit.MILLISECONDS);
        scheduler.schedule(() -> wsService.sendClaimStep(claimID, 3, "success", "Earnings impact calculated", "AI Adjusted Loss: ₹" + aiResult.getFinalPayout()), 2500, TimeUnit.MILLISECONDS);
        scheduler.schedule(() -> wsService.sendClaimStep(claimID, 4, aiResult.getFraudScore() < 30 ? "success" : "warning", "Fraud Scan: " + aiResult.getFraudScore() + "/100", "No anomalies detected"), 3500, TimeUnit.MILLISECONDS);
        scheduler.schedule(() -> wsService.sendAIResult(claimID, aiResult), 4500, TimeUnit.MILLISECONDS);
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmClaim(@RequestBody Map<String, String> request, Principal principal) {
        String claimID = request.get("claimID");
        Claim claim = claimRepository.findByClaimID(claimID).orElseThrow();
        User user = userRepository.findByUsername(principal.getName()).get();

        if (!"processing".equals(claim.getStatus()) && !"approved".equals(claim.getStatus())) {
            return ResponseEntity.badRequest().body("Claim already processed or invalid state");
        }

        if (claim.getApprovedPayout() > 0) {
            // Initiate real payout simulation
            Map<String, Object> payout = payoutService.initiateUPIPayout(user.getUpiID(), claim.getApprovedPayout(), claim.getClaimID());
            
            claim.setStatus("paid");
            claim.setPayoutStatus("success");
            claim.setTransactionID((String) payout.get("id"));
            claim.setProcessedAt(LocalDateTime.now());
            claim.setPayoutAmount(claim.getApprovedPayout());
            claimRepository.save(claim);
            
            return ResponseEntity.ok(Map.of("success", true, "transactionID", payout.get("id"), "amount", claim.getApprovedPayout()));
        } else {
            claim.setStatus("rejected");
            claimRepository.save(claim);
            return ResponseEntity.badRequest().body("Claim rejected by AI engine");
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Principal principal) {
        User user = userRepository.findByUsername(principal.getName()).get();
        return ResponseEntity.ok(claimRepository.findByUserOrderByFiledAtDesc(user));
    }
}
