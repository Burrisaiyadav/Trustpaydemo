package com.trustpay.backend.service;

import com.trustpay.backend.model.EarningsLog;
import com.trustpay.backend.model.MonitoringSession;
import com.trustpay.backend.model.User;
import com.trustpay.backend.repository.EarningsLogRepository;
import com.trustpay.backend.repository.MonitoringSessionRepository;
import com.trustpay.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonitoringService {

    private final MonitoringSessionRepository sessionRepository;
    private final EarningsLogRepository earningsRepository;
    private final UserRepository userRepository;

    @Transactional
    public void startMonitoring(User user) {
        if (sessionRepository.findByUser(user).isPresent()) return;

        MonitoringSession session = MonitoringSession.builder()
                .user(user)
                .startDate(LocalDateTime.now())
                .complete(false)
                .daysActive(0)
                .build();
        
        sessionRepository.save(session);
        log.info("Started monitoring session for user: {}", user.getId());
    }

    @Transactional
    public void updateAllActiveSessions() {
        List<MonitoringSession> activeSessions = sessionRepository.findAll().stream()
                .filter(s -> !s.getComplete())
                .toList();

        for (MonitoringSession session : activeSessions) {
            updateSessionMetrics(session);
        }
    }

    private void updateSessionMetrics(MonitoringSession session) {
        User user = session.getUser();
        long daysDiff = ChronoUnit.DAYS.between(session.getStartDate(), LocalDateTime.now());
        
        // Get logs for the last 7 days
        LocalDate today = LocalDate.now();
        List<EarningsLog> logs = earningsRepository.findByUserAndDateBetween(
                user, today.minusDays(7), today);

        double totalEarnings = logs.stream().mapToDouble(EarningsLog::getAmount).sum();
        long activeDays = logs.stream().filter(l -> l.getAmount() > 100).count();
        double avgEarnings = logs.isEmpty() ? 0.0 : totalEarnings / logs.size();
        int consistency = (int) ((activeDays / 7.0) * 100);

        session.setDaysActive((int) daysDiff);
        session.setTotalEarnings(totalEarnings);
        session.setAvgDailyEarnings(avgEarnings);
        session.setConsistencyScore(consistency);

        // Plan Recommendation
        String recommended = "lite";
        if (avgEarnings >= 1500 || user.getZoneRiskScore() >= 70) {
            recommended = "pro";
        } else if (avgEarnings >= 900 || consistency >= 65) {
            recommended = "standard";
        }
        session.setRecommendedPlan(recommended);

        if (daysDiff >= 7) {
            session.setComplete(true);
            session.setEndDate(LocalDateTime.now());
            
            user.setMonitoringComplete(true);
            user.setMonitoringAvgEarnings(avgEarnings);
            user.setMonitoringConsistency(consistency);
            user.setRecommendedPlan(recommended);
            userRepository.save(user);
        }

        sessionRepository.save(session);
    }
}
