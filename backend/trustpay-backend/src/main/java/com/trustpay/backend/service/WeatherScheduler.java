package com.trustpay.backend.service;

import com.trustpay.backend.model.DisruptionEvent;
import com.trustpay.backend.service.DisruptionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import com.trustpay.backend.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class WeatherScheduler {

    private static final Logger log = LoggerFactory.getLogger(WeatherScheduler.class);

    private final DisruptionService disruptionService;
    private final WeatherService weatherService;
    private final UserRepository userRepository;

    /**
     * Runs every 15 minutes to ingest live weather and trigger parametric disruptions
     */
    @Scheduled(fixedRate = 900000) 
    public void ingestLiveWeather() {
        log.info("Starting live weather ingestion for Trustpay Grid...");

        // In production, we'd loop through all active user H3 indices
        // For demo, we verify the seeded Hyderabad worker's zone
        double lat = 17.4726;
        double lng = 78.3572;
        
        try {
            Map<String, Object> weather = weatherService.getWeather(lat, lng);
            double rainfall = (Double) weather.getOrDefault("rainfall", 0.0);
            double temp = (Double) weather.getOrDefault("temp", 30.0);

            log.info("Live weather check: Rain={}mm, Temp={}C", rainfall, temp);

            if (rainfall > 30.0) {
                log.warn("CRITICAL: Heavy rainfall detected! Triggering parametric disruption.");
                disruptionService.simulateDisruption("RAIN", lat, lng, rainfall);
            } else if (temp > 45.0) {
                log.warn("CRITICAL: Heatwave detected! Triggering parametric disruption.");
                disruptionService.simulateDisruption("HEATWAVE", lat, lng, 0.0);
            }
        } catch (Exception e) {
            log.error("Failed to ingest real-time weather: {}", e.getMessage());
        }
    }
}
