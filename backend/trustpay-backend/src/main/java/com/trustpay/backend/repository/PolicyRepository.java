package com.trustpay.backend.repository;

import com.trustpay.backend.model.Policy;
import com.trustpay.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PolicyRepository extends JpaRepository<Policy, Long> {
    Optional<Policy> findByUserAndStatus(User user, String status);
    Optional<Policy> findByUser(User user);
}
