package com.trustpay.backend.controller;

import com.trustpay.backend.model.User;
import com.trustpay.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;

    @GetMapping("/pending-verifications")
    public ResponseEntity<List<User>> getPendingVerifications() {
        return ResponseEntity.ok(userRepository.findAll().stream()
                .filter(u -> "UNDER_REVIEW".equals(u.getVerificationStatus()))
                .toList());
    }

    @PostMapping("/verify-user/{userId}")
    public ResponseEntity<?> verifyUser(@PathVariable Long userId, @RequestParam boolean approve, @RequestParam(required = false) String reason) {
        User user = userRepository.findById(userId).orElseThrow();
        
        if (approve) {
            user.setVerificationStatus("APPROVED");
            user.setPlatformVerified(true);
        } else {
            user.setVerificationStatus("REJECTED");
            user.setBanReason(reason);
        }
        
        userRepository.save(user);
        return ResponseEntity.ok("User " + (approve ? "approved" : "rejected") + " successfully!");
    }

    @GetMapping("/metrics")
    public ResponseEntity<?> getPlatformMetrics() {
        // Consolidated metrics for Admin Dashboard
        long totalUsers = userRepository.count();
        long verifiedUsers = userRepository.findAll().stream().filter(u -> u.getPlatformVerified()).count();
        
        return ResponseEntity.ok(Map.of(
            "totalUsers", totalUsers,
            "verifiedUsers", verifiedUsers,
            "pendingVerifications", userRepository.findAll().stream().filter(u -> "UNDER_REVIEW".equals(u.getVerificationStatus())).count()
        ));
    }
}
