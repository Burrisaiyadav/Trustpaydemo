package com.trustpay.backend.config;

import com.trustpay.backend.model.User;
import com.trustpay.backend.model.WorkerZoneLog;
import com.trustpay.backend.repository.UserRepository;
import com.trustpay.backend.repository.WorkerZoneLogRepository;
import com.trustpay.backend.service.GeospatialService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BootstrapData implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapData.class);

    private final UserRepository userRepository;
    private final WorkerZoneLogRepository zoneLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final GeospatialService geospatialService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("Bootstrapping Trustpay Backend demo data...");

        // 1. Create Default Worker
        if (!userRepository.existsByUsername("demo_worker")) {
            User worker = User.builder()
                    .username("demo_worker")
                    .password(passwordEncoder.encode("password123"))
                    .email("worker@trustpay.ai")
                    .role("ROLE_WORKER")
                    .workerID("SWG-7721")
                    .build();
            userRepository.save(worker);
            log.info("Created demo worker: demo_worker");
        }

        // 2. Create Initial GPS Heartbeat (Hyderabad Zone)
        double lat = 17.4726;
        double lng = 78.3572;
        String h3Index = geospatialService.latLngToH3(lat, lng, 9);

        WorkerZoneLog initialLog = WorkerZoneLog.builder()
                .workerId("demo_worker")
                .h3Index(h3Index)
                .latitude(lat)
                .longitude(lng)
                .activityStatus("ACTIVE")
                .build();
        
        zoneLogRepository.save(initialLog);
        log.info("Seeded initial GPS heartbeat for demo_worker in H3: {}", h3Index);
    }
}
