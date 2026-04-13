package com.trustpay.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "premium_payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PremiumPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private Policy policy;

    @Column(nullable = false)
    private Double amount;
    
    private String planType;
    private String razorpayOrderID;
    private String razorpayPaymentID;
    private String signature;
    
    @Builder.Default
    private String status = "pending"; // pending, success, failed
    
    private Integer weekNumber;
    private LocalDateTime billingPeriodStart;
    private LocalDateTime billingPeriodEnd;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
