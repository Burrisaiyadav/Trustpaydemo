package com.trustpay.backend.dto;

import lombok.Data;

@Data
public class ClaimRequest {
    private Double latitude;
    private Double longitude;
    private Double accuracy;
    private String locationMethod;
    private String weatherEventOverride;
}
