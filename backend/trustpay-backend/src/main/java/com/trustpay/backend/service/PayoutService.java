package com.trustpay.backend.service;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayoutService {

    @Value("${razorpay.key.id:rzp_test_xxxxxxxxxxxxxx}")
    private String keyId;

    @Value("${razorpay.key.secret:xxxxxxxxxxxxxxxxxxxxxxxx}")
    private String keySecret;

    @Value("${razorpay.account.number:XXXXXXXXXX}")
    private String accountNumber;

    private RazorpayClient razorpayClient;

    @PostConstruct
    public void init() {
        try {
            razorpayClient = new RazorpayClient(keyId, keySecret);
        } catch (RazorpayException e) {
            log.error("Failed to initialize Razorpay client: {}", e.getMessage());
        }
    }

    public Map<String, Object> createOrder(double amount, String receipt) {
        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", (int) (amount * 100)); // amount in paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", receipt);

            Order order = razorpayClient.orders.create(orderRequest);
            
            Map<String, Object> result = new HashMap<>();
            result.put("orderId", order.get("id"));
            result.put("amount", order.get("amount"));
            result.put("currency", order.get("currency"));
            return result;
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed: {}", e.getMessage());
            return null;
        }
    }

    public Map<String, Object> initiateUPIPayout(String upiId, double amount, String claimId) {
        // In a real scenario, this would use RazorpayX for Payouts
        // Here we simulate the logic for a "payout" via their API logic
        log.info("Initiating UPI payout of ₹{} to {} for claim {}", amount, upiId, claimId);
        
        try {
            // Mocking a successful payout response
            Map<String, Object> response = new HashMap<>();
            response.put("id", "pout_" + System.currentTimeMillis());
            response.put("status", "processed");
            response.put("amount", amount);
            response.put("upiId", upiId);
            return response;
        } catch (Exception e) {
            log.error("Payout initiation failed: {}", e.getMessage());
            return null;
        }
    }
}
