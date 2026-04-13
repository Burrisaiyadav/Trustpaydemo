package com.trustpay.backend.controller;

import com.trustpay.backend.model.Policy;
import com.trustpay.backend.model.User;
import com.trustpay.backend.repository.PolicyRepository;
import com.trustpay.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/policies")
@RequiredArgsConstructor
public class PolicyController {

    private final PolicyRepository policyRepository;
    private final UserRepository userRepository;

    @GetMapping("/my-policy")
    public ResponseEntity<?> getMyPolicy(Principal principal) {
        User user = userRepository.findByUsername(principal.getName()).get();
        return ResponseEntity.ok(policyRepository.findByUserAndStatus(user, "active")
                .orElse(null));
    }

    @PostMapping("/activate")
    public ResponseEntity<?> activatePlan(@RequestBody Map<String, String> request, Principal principal) {
        User user = userRepository.findByUsername(principal.getName()).get();
        String planType = request.get("planType");
        
        // Deactivate old policies
        policyRepository.findByUserAndStatus(user, "active").ifPresent(p -> {
            p.setStatus("replaced");
            policyRepository.save(p);
        });

        double premium = switch (planType.toLowerCase()) {
            case "lite" -> 35.0;
            case "pro" -> 150.0;
            default -> 75.0;
        };

        Policy policy = Policy.builder()
                .user(user)
                .planType(planType)
                .status("active")
                .weeklyPremium(premium)
                .aiAdjustedPremium(premium)
                .coverageRate(planType.equals("pro") ? 0.9 : (planType.equals("lite") ? 0.6 : 0.75))
                .maxWeeklyCoverage(planType.equals("pro") ? 3000.0 : (planType.equals("lite") ? 800.0 : 1500.0))
                .startDate(LocalDateTime.now())
                .nextBillingDate(LocalDateTime.now().plusWeeks(1))
                .build();

        user.setActivePlan(planType);
        user.setPlanActivatedOn(LocalDateTime.now());
        user.setNextBillingDate(LocalDateTime.now().plusWeeks(1));
        userRepository.save(user);

        return ResponseEntity.ok(policyRepository.save(policy));
    }

    @GetMapping("/plans")
    public ResponseEntity<?> getPlans() {
        return ResponseEntity.ok(List.of(
            Map.of("type", "lite", "premium", 35, "coverage", 800, "rate", 0.6),
            Map.of("type", "standard", "premium", 75, "coverage", 1500, "rate", 0.75),
            Map.of("type", "pro", "premium", 150, "coverage", 3000, "rate", 0.9)
        ));
    }
}
