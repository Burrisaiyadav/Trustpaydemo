package com.trustpay.backend.repository;

import com.trustpay.backend.model.MonitoringSession;
import com.trustpay.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MonitoringSessionRepository extends JpaRepository<MonitoringSession, Long> {
    Optional<MonitoringSession> findByUser(User user);
    Optional<MonitoringSession> findByUserAndComplete(User user, Boolean complete);
}
