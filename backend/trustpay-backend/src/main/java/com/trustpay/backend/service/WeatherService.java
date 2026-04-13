package com.trustpay.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeatherService {

    private final RestTemplate restTemplate;

    @Value("${weather.api.key:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx}")
    private String apiKey;

    @Value("${weather.api.base:https://api.openweathermap.org/data/2.5}")
    private String apiBase;

    public Map<String, Object> getWeather(double lat, double lng) {
        String url = String.format("%s/weather?lat=%f&lon=%f&appid=%s&units=metric", apiBase, lat, lng, apiKey);
        
        try {
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("main")) {
                Map<String, Object> main = (Map<String, Object>) response.get("main");
                Map<String, Object> wind = (Map<String, Object>) response.get("wind");
                List<Map<String, Object>> weather = (List<Map<String, Object>>) response.get("weather");
                
                double rain = 0.0;
                if (response.containsKey("rain")) {
                    Map<String, Object> rainMap = (Map<String, Object>) response.get("rain");
                    rain = Double.parseDouble(rainMap.getOrDefault("1h", 0.0).toString());
                }

                String event = classifyEvent(rain, Double.parseDouble(main.get("temp").toString()), 
                                           Integer.parseInt(weather.get(0).get("id").toString()));

                Map<String, Object> data = new HashMap<>();
                data.put("temp", main.get("temp"));
                data.put("humidity", main.get("humidity"));
                data.put("windSpeed", wind.get("speed"));
                data.put("rainfall", rain);
                data.put("event", event);
                data.put("description", weather.get(0).get("description"));
                data.put("severity", calculateSeverity(event, rain));
                data.put("isDisruption", calculateSeverity(event, rain) > 0.3);
                data.put("source", "OpenWeatherMap");
                data.put("fetchedAt", LocalDateTime.now().toString());
                
                return data;
            }
        } catch (Exception e) {
            log.error("Weather fetch failed: {}", e.getMessage());
        }
        
        return defaultWeather();
    }

    private String classifyEvent(double rain, double temp, int weatherId) {
        if (rain > 50) return "Flood";
        if (rain > 20 || weatherId == 502) return "Heavy Rain";
        if (rain > 7.5 || weatherId == 501) return "Moderate Rain";
        if (weatherId >= 500 && weatherId < 502) return "Light Rain";
        if (temp > 43) return "Heatwave";
        if (weatherId >= 200 && weatherId < 300) return "Thunderstorm";
        return "Clear";
    }

    private double calculateSeverity(String event, double rain) {
        return switch (event) {
            case "Flood" -> 0.9;
            case "Heavy Rain" -> 0.75;
            case "Heatwave" -> 0.65;
            case "Thunderstorm" -> 0.7;
            case "Moderate Rain" -> 0.45;
            case "Light Rain" -> 0.2;
            default -> 0.0;
        };
    }

    private Map<String, Object> defaultWeather() {
        Map<String, Object> data = new HashMap<>();
        data.put("temp", 32.0);
        data.put("rainfall", 0.0);
        data.put("event", "Clear");
        data.put("severity", 0.0);
        data.put("isDisruption", false);
        data.put("source", "Fallback");
        return data;
    }
}
