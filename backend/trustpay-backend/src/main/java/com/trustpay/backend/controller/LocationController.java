package com.trustpay.backend.controller;

import com.trustpay.backend.model.User;
import com.trustpay.backend.repository.UserRepository;
import com.trustpay.backend.service.GeocodingService;
import com.trustpay.backend.service.GeospatialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LocationController {

    private static final Logger log = LoggerFactory.getLogger(LocationController.class);
    private final UserRepository userRepository;
    private final GeocodingService geocodingService;
    private final GeospatialService geospatialService;

    @PostMapping
    public ResponseEntity<?> updateLocation(@RequestBody Map<String, Double> coords) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        double lat = coords.get("lat");
        double lng = coords.get("lng");

        log.info("Updating location for worker: {} to {}, {}", username, lat, lng);

        return userRepository.findByUsername(username)
                .map(user -> {
                    // 1. Reverse geocode to get City/Zone
                    Map<String, String> address = geocodingService.reverseGeocode(lat, lng);
                    user.setCity(address.get("city"));
                    user.setZone(address.get("zone"));
                    user.setLatitude(lat);
                    user.setLongitude(lng);

                    // 2. Map to H3 Grid
                    String h3Index = geospatialService.latLngToH3(lat, lng, 9);
                    user.setCurrentH3Index(h3Index);

                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of(
                        "city", user.getCity(),
                        "zone", user.getZone(),
                        "h3Index", h3Index
                    ));
                })
                .orElse(ResponseEntity.status(404).build());
    }
}
