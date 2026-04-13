package com.trustpay.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "claims")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Claim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String claimID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Long policyID;

    private String status; // pending, processing, approved, paid, rejected, appealing

    // --- LOCATION ---
    private String zone;
    private String city;
    private Double latitude;
    private Double longitude;
    private Double accuracy;
    private String locationMethod; // gps, manual
    private String address;
    private LocalDateTime locationVerifiedAt;

    // --- WEATHER ---
    private String weatherEvent;
    private String weatherIntensity;
    private Double temperature;
    private Double humidity;
    private Double windSpeed;
    private Double rainfall;
    private String weatherDescription;
    private String weatherSource;
    private LocalDateTime weatherFetchedAt;

    // --- EARNINGS ---
    private Double expectedEarnings;
    private Double actualEarnings;
    private Double incomeLoss;
    private String timeOfDay;
    private Integer hourOfClaim;
    private Double avgDailyBase;

    // --- AI DECISION ---
    private Double approvedPayout;
    private Double coverageRate;
    private Integer fraudScore;
    private Double aiConfidence;
    private String modelVersion;
    private Long processingTimeMs;
    
    @Column(columnDefinition = "TEXT")
    private String aiExplanation; // JSON or comma-separated
    
    @Column(columnDefinition = "TEXT")
    private String fraudFlags;

    // --- PAYOUT ---
    private Double payoutAmount;
    private String upiID;
    private String razorpayPayoutID;
    private String transactionID;
    private String payoutStatus;
    private LocalDateTime payoutInitiatedAt;
    private LocalDateTime payoutCompletedAt;

    private Boolean zeroTouch = false;
    private String appealNote;
    private String appealEvidenceUrl;
    private String rejectionReason;
    private String receiptURL;

    @Column(updatable = false)
    private LocalDateTime filedAt;
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        filedAt = LocalDateTime.now();
        if (status == null) status = "pending";
    }
}
