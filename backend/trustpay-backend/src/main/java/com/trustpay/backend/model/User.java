package com.trustpay.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true)
    private String phone;

    private String name;
    private String role; // USER, ADMIN
    private String city;
    private String zone;
    private String pincode;
    private String platform; // Swiggy, Zomato, Zepto, etc.
    private String vehicleType;
    private String workerID;
    private Double avgDailyEarnings;

    // --- VERIFICATION ---
    private Boolean aadhaarVerified = false;
    private String aadhaarHash;
    private Boolean panVerified = false;
    private String panHash;
    private String panName;
    private String upiID;
    private Boolean upiVerified = false;

    // --- MANUAL VERIFICATION ---
    private String platformProofUrl;
    private Boolean platformVerified = false;
    private String verificationStatus; // PENDING, APPROVED, REJECTED

    // --- PLAN & PROTECTION ---
    private String activePlan; // none, lite, standard, pro
    private LocalDateTime planActivatedOn;
    private LocalDateTime nextBillingDate;
    private Integer protectionScore = 50;

    // --- MONITORING DATA ---
    private Boolean monitoringComplete = false;
    private LocalDateTime monitoringStartDate;
    private Integer monitoringActiveDays = 0;
    private Double monitoringAvgEarnings = 0.0;
    private Integer monitoringConsistency = 0;
    private String recommendedPlan;

    // --- RISK PROFILE ---
    private Integer fraudScore = 0;
    private Integer claimFrequency = 0;
    private Integer zoneRiskScore = 50;
    private Double earningsVariance = 0.0;

    // --- LOCATION ---
    private Double latitude;
    private Double longitude;
    private LocalDateTime lastLocationUpdate;

    // --- ACCOUNT STATUS ---
    private Boolean isActive = true;
    private Boolean isBanned = false;
    private String banReason;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (role == null) role = "USER";
        if (verificationStatus == null) verificationStatus = "PENDING";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
