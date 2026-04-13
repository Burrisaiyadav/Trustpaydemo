package com.trustpay.backend.job;

import com.trustpay.backend.service.MonitoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TrustpayBackgroundJobs {

    private final MonitoringService monitoringService;

    // Daily at midnight
    @Scheduled(cron = "0 0 0 * * *")
    public void runDailyMonitoring() {
        log.info("[Job] Running daily monitoring session updates...");
        monitoringService.updateAllActiveSessions();
    }

    // Weekly billing check (simulated daily for demo)
    @Scheduled(cron = "0 0 1 * * *")
    public void runWeeklyBilling() {
        log.info("[Job] Running weekly billing renewals...");
        // Logic to charge premium via Razorpay would go here
    }
}
