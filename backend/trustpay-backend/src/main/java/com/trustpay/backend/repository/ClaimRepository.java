package com.trustpay.backend.repository;

import com.trustpay.backend.model.Claim;
import com.trustpay.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ClaimRepository extends JpaRepository<Claim, Long> {
    Optional<Claim> findByClaimID(String claimID);
    List<Claim> findByUserOrderByFiledAtDesc(User user);
    Page<Claim> findByUserOrderByFiledAtDesc(User user, Pageable pageable);
    List<Claim> findByUserAndStatus(User user, String status);
}
