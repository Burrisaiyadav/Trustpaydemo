package com.trustpay.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PANService {

    private final RestTemplate restTemplate;

    @Value("${sandbox.api.key:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx}")
    private String apiKey;

    @Value("${sandbox.api.secret:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx}")
    private String apiSecret;

    private String getAccessToken() {
        String url = "https://api.sandbox.co.in/authenticate";
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", apiKey);
        headers.set("x-api-secret", apiSecret);
        headers.set("x-api-version", "1.0");

        HttpEntity<String> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (String) response.getBody().get("access_token");
            }
        } catch (Exception e) {
            log.error("Failed to get Sandbox access token: {}", e.getMessage());
        }
        return null;
    }

    public Map<String, Object> verifyPAN(String pan, String fullName) {
        String token = getAccessToken();
        if (token == null) {
            return Map.of("verified", false, "error", "Service unavailable");
        }

        String url = "https://api.sandbox.co.in/pans/" + pan.toUpperCase() + "/verify";
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);
        headers.set("x-api-key", apiKey);
        headers.set("x-api-version", "1.0");

        HttpEntity<String> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                String registeredName = (String) data.getOrDefault("registered_name", "");
                
                boolean nameMatches = registeredName.toLowerCase().contains(fullName.toLowerCase()) ||
                                     fullName.toLowerCase().contains(registeredName.toLowerCase());

                Map<String, Object> result = new HashMap<>();
                result.put("verified", true);
                result.put("registeredName", registeredName);
                result.put("nameMatches", nameMatches);
                result.put("panStatus", data.get("pan_status"));
                return result;
            }
        } catch (Exception e) {
            log.error("PAN verification failed: {}", e.getMessage());
        }

        return Map.of("verified", false, "error", "Verification failed");
    }
}
