package com.trustpay.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "monitoring_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonitoringSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private LocalDateTime startDate;
    private LocalDateTime endDate;
    
    @Builder.Default
    private Boolean complete = false;
    
    @Builder.Default
    private Integer daysActive = 0;

    // Summary Metrics
    private Double avgDailyEarnings;
    private Double totalEarnings;
    private Integer consistencyScore;
    private String peakEarningDay;
    private String mostActiveZone;
    private Integer weatherRiskDays;
    private String recommendedPlan;
    
    private Double aiPremiumLite;
    private Double aiPremiumStandard;
    private Double aiPremiumPro;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (startDate == null) startDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
