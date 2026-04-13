package com.trustpay.backend.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Component
@Slf4j
@Data
public class TrustpayMLModel {
    private final String version = "trustpay-ml-v3.0-java";
    private final int inputDim = 20;
    private final int[] hiddenDims = {32, 16, 8};
    private final int outputDim = 3;

    private double[][] w1, w2, w3, w4;
    private double[] b1, b2, b3, b4;

    public TrustpayMLModel() {
        initWeights();
    }

    private void initWeights() {
        // Deterministic seeding for consistency (as in the original prompt logic)
        w1 = new double[32][20];
        b1 = new double[32];
        for (int i = 0; i < 32; i++) {
            for (int j = 0; j < 20; j++) w1[i][j] = seed(i, j, 1) * 0.5;
            b1[i] = seed(i, 0, 10) * 0.1;
        }

        w2 = new double[16][32];
        b2 = new double[16];
        for (int i = 0; i < 16; i++) {
            for (int j = 0; j < 32; j++) w2[i][j] = seed(i, j, 2) * 0.45;
            b2[i] = seed(i, 0, 20) * 0.08;
        }

        w3 = new double[8][16];
        b3 = new double[8];
        for (int i = 0; i < 8; i++) {
            for (int j = 0; j < 16; j++) w3[i][j] = seed(i, j, 3) * 0.4;
            b3[i] = seed(i, 0, 30) * 0.06;
        }

        w4 = new double[3][8];
        b4 = new double[]{0.15, -0.05, 0.3};
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 8; j++) w4[i][j] = seed(i, j, 4) * 0.42;
        }

        log.info("[ML] Model initialized — version: {}", version);
    }

    private double seed(int i, int j, int layer) {
        return Math.tanh(Math.sin(i * 3.7 + j * 1.3 + layer * 7.1) * 2.5);
    }

    private double relu(double x) { return Math.max(0, x); }
    private double sigmoid(double x) { return 1.0 / (1.0 + Math.exp(-x)); }

    public double[] forward(double[] inputArr) {
        // Layer 1: 20 → 32 (ReLU)
        double[] h1 = new double[32];
        for (int i = 0; i < 32; i++) {
            double sum = b1[i];
            for (int j = 0; j < 20; j++) sum += w1[i][j] * inputArr[j];
            h1[i] = relu(sum);
        }

        // Layer 2: 32 → 16 (ReLU)
        double[] h2 = new double[16];
        for (int i = 0; i < 16; i++) {
            double sum = b2[i];
            for (int j = 0; j < 32; j++) sum += w2[i][j] * h1[j];
            h2[i] = relu(sum);
        }

        // Layer 3: 16 → 8 (ReLU)
        double[] h3 = new double[8];
        for (int i = 0; i < 8; i++) {
            double sum = b3[i];
            for (int j = 0; j < 16; j++) sum += w3[i][j] * h2[j];
            h3[i] = relu(sum);
        }

        // Layer 4: 8 → 3 (Sigmoid)
        double[] out = new double[3];
        for (int i = 0; i < 3; i++) {
            double sum = b4[i];
            for (int j = 0; j < 8; j++) sum += w4[i][j] * h3[j];
            out[i] = sigmoid(sum);
        }

        return out; // [payoutRatio, fraudProb, confidence]
    }

    public PredictionResult predict(Map<String, Object> inputData) {
        long start = System.currentTimeMillis();
        
        // Mock feature extraction (to be replaced by FeatureEngineering service)
        double[] features = new double[20];
        Random rnd = new Random();
        for(int i=0; i<20; i++) features[i] = rnd.nextDouble(); 

        double[] output = forward(features);
        double payoutRatio = output[0];
        double fraudProb = output[1];
        double confidence = output[2];

        String planType = (String) inputData.getOrDefault("planType", "standard");
        PlanConfig plan = getPlanConfig(planType);

        double avgEarnings = (double) inputData.getOrDefault("avgDailyEarnings", 1200.0);
        double hourlyRate = avgEarnings / 10.0;
        
        // Simplified factors (port from Node.js breakdown logic)
        double expectedHourly = hourlyRate * 1.2; 
        double actualHourly = expectedHourly * 0.4;
        double rawLoss = Math.max(expectedHourly - actualHourly, 0);
        double aiLoss = rawLoss * (0.8 + payoutRatio * 0.4);
        double grossPayout = aiLoss * plan.getCoverageRate();

        List<String> flags = new ArrayList<>();
        double finalPayout = grossPayout;
        boolean approved = true;

        if (fraudProb > 0.65) {
            approved = false;
            flags.add("HIGH_FRAUD_RISK");
        } else if (fraudProb > 0.35) {
            finalPayout *= 0.55;
            flags.add("MODERATE_FRAUD_RISK");
        }

        if (rawLoss < 30) {
            approved = false;
            flags.add("LOSS_BELOW_THRESHOLD");
        }

        finalPayout = approved ? Math.min(Math.max(Math.round(finalPayout), 0), plan.getMaxWeeklyCoverage()) : 0;

        PredictionResult res = new PredictionResult();
        res.setApproved(approved);
        res.setFinalPayout(finalPayout);
        res.setFraudScore((int) (fraudProb * 100));
        res.setConfidence(String.format("%.1f", Math.min(98, Math.max(70, (confidence * 35) + 60))));
        res.setModelVersion(version);
        res.setProcessingTimeMs(System.currentTimeMillis() - start);
        res.setFraudFlags(flags);
        res.setRejectionReason(!approved ? getRejectionReason(flags) : null);
        
        return res;
    }

    private String getRejectionReason(List<String> flags) {
        if (flags.contains("HIGH_FRAUD_RISK")) return "Suspicious activity detected";
        if (flags.contains("LOSS_BELOW_THRESHOLD")) return "Income loss below minimum threshold";
        return "Claim does not meet coverage criteria";
    }

    private PlanConfig getPlanConfig(String type) {
        return switch (type.toLowerCase()) {
            case "lite" -> new PlanConfig("Lite", 0.60, 800.0);
            case "pro" -> new PlanConfig("Pro", 0.90, 3000.0);
            default -> new PlanConfig("Standard", 0.75, 1500.0);
        };
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PlanConfig {
        private String name;
        private double coverageRate;
        private double maxWeeklyCoverage;
    }

    @Data
    public static class PredictionResult {
        private boolean approved;
        private double finalPayout;
        private int fraudScore;
        private String confidence;
        private String modelVersion;
        private long processingTimeMs;
        private List<String> fraudFlags;
        private String rejectionReason;
    }
}
