package com.trustpay.backend.repository;

import com.trustpay.backend.model.EarningsLog;
import com.trustpay.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EarningsLogRepository extends JpaRepository<EarningsLog, Long> {
    List<EarningsLog> findByUserAndDateBetween(User user, LocalDate start, LocalDate end);
    Optional<EarningsLog> findByUserAndDate(User user, LocalDate date);
    List<EarningsLog> findByUserOrderByDateDesc(User user);
}
