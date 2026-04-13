package com.trustpay.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "policies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Policy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String planType; // lite, standard, pro
    private String status; // active, paused, cancelled, expired
    
    private Double weeklyPremium;
    private Double aiAdjustedPremium;
    private Double coverageRate;
    private Double maxWeeklyCoverage;

    private LocalDateTime startDate;
    private LocalDateTime nextBillingDate;
    
    @Builder.Default
    private Boolean autoRenew = true;

    @ElementCollection
    private List<String> zonesEnabled;

    @Builder.Default
    private Double totalPremiumPaid = 0.0;
    @Builder.Default
    private Double totalClaimsReceived = 0.0;
    @Builder.Default
    private Integer claimsCount = 0;
    @Builder.Default
    private Double returnRatio = 0.0;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (startDate == null) startDate = LocalDateTime.now();
        if (status == null) status = "active";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
