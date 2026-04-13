import * as tf from '@tensorflow/tfjs';
import { TrustpayDB, TrustpayComputed } from './TrustpayData.js';
import { h3Index } from '../utils/h3_simulator.js';
import TrustpayMLEngine from './TrustpayMLEngine';

// ═══════════════════════════════════════════════════
// FEATURE 1 — AI DYNAMIC PRICING MODEL
// ═══════════════════════════════════════════════════

export const TrustpayDynamicPricing = {

  // Base premiums (starting point before AI adjustment)
  BASE_PREMIUMS: {
    lite:     20,
    standard: 35,
    pro:      50,
  },

  // ── RISK FACTOR WEIGHTS ──
  // Each factor adjusts premium up or down
  // Total adjustment range: -8 to +12 rupees per week

  RISK_FACTORS: {

    // Factor 1: Zone waterlogging history
    // Source: Mock API — IMD flood zone data
    // Safe zone = -₹2, High flood risk = +₹3
    zoneWaterlogging: {
      weight:      { safe: -2, moderate: 0, high: +3 },
      description: "Historical waterlogging risk in your zone",
      dataSource:  "IMD Flood Zone Registry (Mock)",
    },

    // Factor 2: Weather disruption frequency (last 90 days)
    // Source: Mock OpenWeatherMap history
    // < 3 events = -₹1.5, > 8 events = +₹2.5
    weatherFrequency: {
      weight:      { low: -1.5, medium: 0, high: +2.5 },
      description: "Weather disruption events in last 90 days",
      dataSource:  "OpenWeatherMap Historical (Mock)",
    },

    // Factor 3: City traffic congestion index
    // Source: Mock Google Maps Traffic API
    // Low congestion = -₹1, High = +₹2
    trafficCongestion: {
      weight:      { low: -1, medium: 0, high: +2 },
      description: "Average traffic congestion in work zone",
      dataSource:  "Traffic Index API (Mock)",
    },

    // Factor 4: User's personal claim history
    // 0 claims in 60 days = -₹2, 5+ claims = +₹3
    claimHistory: {
      weight:      { clean: -2, average: 0, frequent: +3 },
      description: "Your personal claim frequency",
      dataSource:  "Trustpay Internal",
    },

    // Factor 5: Vehicle type risk
    // Bicycle = +₹1 (more exposure), 3-wheeler = -₹0.5
    vehicleRisk: {
      weight: {
        "Bicycle":   +1,
        "2-Wheeler": 0,
        "3-Wheeler": -0.5,
      },
      description: "Risk based on your vehicle type",
      dataSource:  "Trustpay Actuarial Model",
    },

    // Factor 6: Peak hour exposure
    // Works mostly 5-9 PM (peak rain risk) = +₹1.5
    // Works mostly morning = -₹1
    peakHourExposure: {
      weight:      { morning: -1, mixed: 0, evening: +1.5 },
      description: "Hours you typically work",
      dataSource:  "Trustpay Usage Patterns",
    },

    // Factor 7: Earnings stability score
    // Stable earnings (low variance) = -₹1, very volatile = +₹1.5
    earningsStability: {
      weight:      { stable: -1, moderate: 0, volatile: +1.5 },
      description: "Consistency of your daily earnings",
      dataSource:  "Partner Earnings Data",
    },

    // Factor 8: Predictive weather score (next 30 days)
    // Source: Mock 30-day forecast API
    // Low risk forecast = -₹1.5, High = +₹2
    weatherForecast30d: {
      weight:      { favorable: -1.5, neutral: 0, risky: +2 },
      description: "AI weather forecast for next 30 days",
      dataSource:  "AccuWeather Forecast (Mock)",
    },
  },

  // ── MAIN PRICING FUNCTION ──
  calculatePersonalizedPremium(planType, userData, locationData) {
    const base     = this.BASE_PREMIUMS[planType];
    const factors  = this.assessRiskFactors(userData, locationData);
    const rawAdj   = factors.reduce((sum, f) => sum + f.adjustment, 0);

    // Cap total adjustment: never go below ₹12 or above base + ₹12
    const cappedAdj = Math.max(-8, Math.min(12, rawAdj));
    const final     = Math.round((base + cappedAdj) * 10) / 10;

    // Savings message
    const savedVsBase = base - final;

    return {
      planType,
      basePremium:       base,
      finalPremium:      Math.max(final, 12), // floor at ₹12
      totalAdjustment:   Math.round(cappedAdj * 10) / 10,
      savedVsBase:       savedVsBase > 0 ? Math.round(savedVsBase * 10) / 10 : 0,
      factors,
      confidenceScore:   this.calculateConfidence(factors),
      nextReviewDate:    this.getNextReviewDate(),
      breakdown:         this.buildBreakdownText(factors, savedVsBase),
    };
  },

  // Added for async compatibility
  async calculatePersonalizedPremiumAsync(planType, userData, locationData) {
    return this.calculatePersonalizedPremium(planType, userData, locationData);
  },

  assessRiskFactors(userData, locationData) {
    const zone    = locationData?.zone || userData?.zone || "Kondapur";
    const city    = userData?.city || "Hyderabad";
    const claims  = TrustpayDB.claims?.length || 0;
    const vehicle = userData?.vehicleType || "2-Wheeler";
    const earnings = TrustpayDB.dailyEarnings || [];

    const factors = [];

    // Factor 1: Zone waterlogging
    const WATERLOGGING_ZONES = {
      "Kondapur":     "moderate",
      "Gachibowli":   "moderate",
      "HITEC City":   "high",
      "Madhapur":     "safe",
      "Banjara Hills":"safe",
      "Jubilee Hills":"safe",
      "Kukatpally":   "high",
      "Secunderabad": "moderate",
      "Koramangala":  "safe",
      "Andheri West": "moderate",
      "T. Nagar":     "high",
    };
    const wlLevel = WATERLOGGING_ZONES[zone] || "moderate";
    const wlAdj   = this.RISK_FACTORS.zoneWaterlogging.weight[wlLevel];
    factors.push({
      name:        "Zone Waterlogging Risk",
      level:       wlLevel,
      adjustment:  wlAdj,
      icon:        "💧",
      positive:    wlAdj <= 0,
      description: `${zone} has ${wlLevel} waterlogging history`,
      source:      "IMD Flood Zone Data",
    });

    // Factor 2: Weather frequency (mock — derive from claim history)
    const recentClaims = TrustpayDB.claims?.filter(c => {
      const days = (new Date("2025-06-28") - new Date(c.date)) / 86400000;
      return days <= 90 && c.event?.includes("Rain");
    }).length || 2;
    const wxLevel = recentClaims < 3 ? "low" : recentClaims < 7 ? "medium" : "high";
    const wxAdj   = this.RISK_FACTORS.weatherFrequency.weight[wxLevel];
    factors.push({
      name:        "Weather Event Frequency",
      level:       wxLevel,
      adjustment:  wxAdj,
      icon:        "🌧",
      positive:    wxAdj <= 0,
      description: `${recentClaims} weather events in last 90 days`,
      source:      "Weather History API",
    });

    // Factor 3: Traffic congestion
    const TRAFFIC_INDEX = {
      "Hyderabad":  "medium",
      "Bengaluru":  "high",
      "Mumbai":     "high",
      "Delhi":      "high",
      "Chennai":    "medium",
      "Pune":       "low",
    };
    const trafficLevel = TRAFFIC_INDEX[city] || "medium";
    const trafficAdj   = this.RISK_FACTORS.trafficCongestion.weight[trafficLevel];
    factors.push({
      name:        "City Traffic Congestion",
      level:       trafficLevel,
      adjustment:  trafficAdj,
      icon:        "🚦",
      positive:    trafficAdj <= 0,
      description: `${city} traffic index: ${trafficLevel}`,
      source:      "Traffic Index API",
    });

    // Factor 4: Personal claim history
    const claimLevel = claims === 0 ? "clean" : claims < 5 ? "average" : "frequent";
    const claimAdj   = this.RISK_FACTORS.claimHistory.weight[claimLevel];
    factors.push({
      name:        "Your Claim History",
      level:       claimLevel,
      adjustment:  claimAdj,
      icon:        "📋",
      positive:    claimAdj <= 0,
      description: claims === 0
        ? "No claims filed — clean record"
        : `${claims} claims filed total`,
      source:      "Trustpay Records",
    });

    // Factor 5: Vehicle risk
    const vehicleAdj = this.RISK_FACTORS.vehicleRisk.weight[vehicle] || 0;
    factors.push({
      name:        "Vehicle Risk",
      level:       vehicle,
      adjustment:  vehicleAdj,
      icon:        vehicle === "Bicycle" ? "🚲" : vehicle === "2-Wheeler" ? "🛵" : "🛺",
      positive:    vehicleAdj <= 0,
      description: `${vehicle} risk profile`,
      source:      "Actuarial Model",
    });

    // Factor 6: Peak hour exposure (derive from daily earnings pattern)
    const eveningEarnings = earnings
      .filter(d => d.risk === "high").length;
    const peakLevel = eveningEarnings > 5 ? "evening" :
                      eveningEarnings > 2 ? "mixed" : "morning";
    const peakAdj   = this.RISK_FACTORS.peakHourExposure.weight[peakLevel];
    factors.push({
      name:        "Peak Hour Exposure",
      level:       peakLevel,
      adjustment:  peakAdj,
      icon:        "🕐",
      positive:    peakAdj <= 0,
      description: `You work mostly ${peakLevel} hours`,
      source:      "Usage Pattern Analysis",
    });

    // Factor 7: Earnings stability
    const amounts    = earnings.map(d => d.earnings);
    const avg        = amounts.reduce((a, b) => a + b, 0) / (amounts.length || 1);
    const variance   = amounts.reduce((s, v) => s + Math.pow(v - avg, 2), 0)
                       / (amounts.length || 1);
    const stdDev     = Math.sqrt(variance);
    const stability  = stdDev < 200 ? "stable" : stdDev < 450 ? "moderate" : "volatile";
    const stabilityAdj = this.RISK_FACTORS.earningsStability.weight[stability];
    factors.push({
      name:        "Earnings Stability",
      level:       stability,
      adjustment:  stabilityAdj,
      icon:        "📈",
      positive:    stabilityAdj <= 0,
      description: `Your daily earnings are ${stability}`,
      source:      "Earnings Analysis",
    });

    // Factor 8: 30-day weather forecast (mock)
    const FORECAST_RISK = {
      "Hyderabad":  "risky",
      "Bengaluru":  "neutral",
      "Mumbai":     "risky",
      "Delhi":      "neutral",
      "Chennai":    "risky",
      "Pune":       "favorable",
    };
    const forecastLevel = FORECAST_RISK[city] || "neutral";
    const forecastAdj   = this.RISK_FACTORS.weatherForecast30d.weight[forecastLevel];
    factors.push({
      name:        "30-Day Weather Forecast",
      level:       forecastLevel,
      adjustment:  forecastAdj,
      icon:        "🌤",
      positive:    forecastAdj <= 0,
      description: `AI forecast for ${city}: ${forecastLevel}`,
      source:      "AccuWeather Forecast API",
    });

    return factors;
  },

  calculateConfidence(factors) {
    // More data points = higher confidence
    const score = 72 + factors.filter(f => f.source !== "Trustpay Records").length * 2;
    return Math.min(score, 96);
  },

  getNextReviewDate() {
    const d = new Date("2025-07-05");
    return d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
  },

  buildBreakdownText(factors, savings) {
    const positives = factors.filter(f => f.positive);
    const negatives = factors.filter(f => !f.positive);
    return {
      savingsFactors: positives.map(f => f.description),
      riskFactors:    negatives.map(f => f.description),
      summary: savings > 0
        ? `AI saved you ₹${savings}/week based on your low-risk profile`
        : `Premium adjusted for your risk zone`,
    };
  },

  // ── EXTENDED COVERAGE HOURS ──
  // If weather forecast is low risk: offer 2 extra coverage hours free
  calculateBonusCoverageHours(userData, locationData) {
    const zone = locationData?.zone || userData?.zone;
    const SAFE_ZONES = ["Madhapur","Banjara Hills","Jubilee Hills","Koramangala"];
    const isLowRisk  = SAFE_ZONES.includes(zone);

    return {
      bonusHours:  isLowRisk ? 2 : 0,
      reason:      isLowRisk
        ? `${zone} is a low-risk zone — 2 free bonus coverage hours added`
        : null,
      totalHours:  isLowRisk ? 12 : 10,
    };
  },
};

// ═══════════════════════════════════════════════════
// FEATURE 2 — AUTOMATED DISRUPTION TRIGGERS
// ═══════════════════════════════════════════════════

export const TrustpayTriggers = {

  activeWatchers: [],
  checkInterval:  null,
  _firedCallbacks: [],

  // Register a callback to receive trigger events (used by React components)
  onTriggerFired(callback) {
    this._firedCallbacks.push(callback);
    return () => { this._firedCallbacks = this._firedCallbacks.filter(cb => cb !== callback); };
  },

  // Start all triggers when user reaches dashboard
  startAllTriggers(userData, locationData) {
    console.log("[Trustpay] Starting 5 automated disruption triggers...");
    this.stopAllTriggers();
    
    this.checkInterval = setInterval(() => {
      this.runAllChecks(userData, locationData);
    }, 30000); // Check every 30 seconds

    // Run immediately on start
    this.runAllChecks(userData, locationData);
    
    // Guarantee 1 demo trigger for proof of concept
    setTimeout(() => this.forceDemoTrigger(userData), 1000);
  },

  stopAllTriggers() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = null;
    this.activeWatchers = [];
  },

  async runAllChecks(userData, locationData) {
    const results = await Promise.allSettled([
      this.trigger1_HeavyRainfall(locationData),
      this.trigger2_ExtremeHeat(locationData),
      this.trigger3_TrafficDisruption(locationData),
      this.trigger4_AirQualityAlert(locationData),
      this.trigger5_LocalFloodWarning(locationData),
    ]);

    results.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value?.triggered) {
        this.handleTriggerFired(result.value, userData);
      }
    });
  },

  // TRIGGER 1 — HEAVY RAINFALL
  async trigger1_HeavyRainfall(locationData) {
    try {
      const currentHour = new Date().getHours();
      const isRainHour  = currentHour >= 16 && currentHour <= 20;
      const mockRainfall = isRainHour ? 28 : 3;
      const triggered    = mockRainfall > 15;

      return {
        triggered,
        triggerID:   "TRIGGER_RAIN",
        event:       "Heavy Rainfall",
        severity:    "HIGH",
        icon:        "🌧",
        detail:      `${mockRainfall}mm/hr rainfall detected`,
        source:      "OpenWeatherMap API",
        apiEndpoint: "api.openweathermap.org/data/2.5/weather",
        estimatedLoss: this.estimateLoss("Heavy Rainfall", locationData),
        color:        "#00E0FF",
      };
    } catch {
      return { triggered: false };
    }
  },

  // TRIGGER 2 — EXTREME HEAT
  async trigger2_ExtremeHeat(locationData) {
    try {
      const hour       = new Date().getHours();
      const mockTemp   = (hour >= 12 && hour <= 16) ? 44 : 31;
      const triggered  = mockTemp > 42;

      return {
        triggered,
        triggerID:    "TRIGGER_HEAT",
        event:        "Extreme Heatwave",
        severity:     "HIGH",
        icon:         "🌡️",
        detail:       `Temperature ${mockTemp}°C — exceeds safe working threshold`,
        source:       "OpenWeatherMap + Heat Index Model",
        apiEndpoint:  "api.openweathermap.org/data/2.5/weather",
        estimatedLoss: this.estimateLoss("Heatwave", locationData),
        color:        "#FF8C42",
      };
    } catch {
      return { triggered: false };
    }
  },

  // TRIGGER 3 — MAJOR TRAFFIC DISRUPTION
  async trigger3_TrafficDisruption(locationData) {
    try {
      const hour        = new Date().getHours();
      const isPeakHour  = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
      const mockIndex   = isPeakHour ? 0.78 : 0.25;
      const triggered   = mockIndex > 0.70;

      return {
        triggered,
        triggerID:    "TRIGGER_TRAFFIC",
        event:        "Major Traffic Disruption",
        severity:     "MEDIUM",
        icon:         "🚦",
        detail:       `Traffic congestion at ${Math.round(mockIndex * 100)}% — roads severely blocked`,
        source:       "TomTom Traffic Flow API",
        apiEndpoint:  "api.tomtom.com/traffic/services/4/flowSegmentData",
        estimatedLoss: this.estimateLoss("Road Block", locationData),
        color:        "#FF8C42",
      };
    } catch {
      return { triggered: false };
    }
  },

  // TRIGGER 4 — DANGEROUS AIR QUALITY
  async trigger4_AirQualityAlert(locationData) {
    try {
      const HIGH_AQI_CITIES = ["Delhi","Mumbai","Kanpur"];
      const userCity  = TrustpayDB.currentUser?.city || "Hyderabad";
      const mockAQI   = HIGH_AQI_CITIES.includes(userCity) ? 5 : 2;
      const triggered = mockAQI >= 4;

      return {
        triggered,
        triggerID:    "TRIGGER_AQI",
        event:        "Dangerous Air Quality",
        severity:     "MEDIUM",
        icon:         "😷",
        detail:       `AQI ${mockAQI * 50} — Hazardous for outdoor workers`,
        source:       "OpenWeatherMap Air Pollution API",
        apiEndpoint:  "api.openweathermap.org/data/2.5/air_pollution",
        estimatedLoss: this.estimateLoss("Air Quality", locationData),
        color:        "#FF4D6A",
      };
    } catch {
      return { triggered: false };
    }
  },

  // TRIGGER 5 — LOCAL FLOOD WARNING
  async trigger5_LocalFloodWarning(locationData) {
    try {
      const FLOOD_PRONE = ["HITEC City","Kukatpally","Andheri West","T. Nagar"];
      const userZone    = TrustpayDB.currentUser?.zone || "Kondapur";
      const triggered   = FLOOD_PRONE.includes(userZone) &&
                          new Date().getHours() >= 16;

      return {
        triggered,
        triggerID:    "TRIGGER_FLOOD",
        event:        "Local Flood Warning",
        severity:     "CRITICAL",
        icon:         "🌊",
        detail:       `Official flood warning issued for ${userZone} district`,
        source:       "India WRIS Flood Alert System",
        apiEndpoint:  "api.india-wris.gov.in/flood-alerts",
        estimatedLoss: this.estimateLoss("Flood", locationData),
        color:        "#FF4D6A",
      };
    } catch {
      return { triggered: false };
    }
  },

  // Estimate income loss when trigger fires
  estimateLoss(eventType, locationData) {
    const currentHour = new Date().getHours();
    const hourlyRates = {
      morning:   68,
      lunch:     110,
      afternoon: 54,
      evening:   120,
      night:     48,
    };
    const period = currentHour < 11 ? "morning" :
                   currentHour < 14 ? "lunch" :
                   currentHour < 17 ? "afternoon" :
                   currentHour < 21 ? "evening" : "night";

    const weatherImpact = {
      "Heavy Rainfall":         0.72,
      "Heatwave":               0.78,
      "Road Block":             0.62,
      "Air Quality":            0.55,
      "Flood":                  0.82,
      "Major Traffic Disruption": 0.65,
    };

    const baseRate   = hourlyRates[period];
    const lossRate   = baseRate * (weatherImpact[eventType] || 0.70);
    const hoursAffected = 2;
    return Math.round(lossRate * hoursAffected);
  },

  // Called when any trigger fires
  handleTriggerFired(triggerData, userData) {
    const key     = `last_${triggerData.triggerID}`;
    const lastFired = parseInt(sessionStorage.getItem(key) || "0");
    const now       = Date.now();
    if (now - lastFired < 1800000) return; // 30 min cooldown
    sessionStorage.setItem(key, now.toString());
    sessionStorage.setItem(`trigger_${triggerData.triggerID}`, JSON.stringify(triggerData));

    this._firedCallbacks.forEach(cb => cb(triggerData, userData));
  },

  forceDemoTrigger(userData) {
    const demo = {
      triggered: true,
      triggerID: "TRIGGER_RAIN",
      event: "Heavy Rainfall",
      severity: "HIGH",
      icon: "🌧",
      detail: "28mm/hr rainfall detected in your zone",
      source: "OpenWeatherMap API",
      estimatedLoss: 180,
      color: "#00E0FF",
    };
    this.handleTriggerFired(demo, userData);
  }
};

// ═══════════════════════════════════════════════════
// FEATURE 3 — ZERO-TOUCH CLAIM PROCESSING
// ═══════════════════════════════════════════════════

export const TrustpayZeroTouch = {

  // Called when user taps "Claim Now" on disruption banner
  async initiateSingleTapClaim(triggerID, estimatedPayout, triggerData) {
    const user      = TrustpayDB.currentUser;
    const planType  = user.plan || "standard";
    const plan      = TrustpayDB.plans[planType];
    const trigger   = triggerData || this.getActiveTrigger(triggerID);

    if (!plan || !trigger) return null;

    // Use Advanced AI/ML Engine for payout prediction
    const weatherData = { 
        event: trigger.event, 
        rainfall: trigger.event === 'Heavy Rainfall' ? 28 : 0,
        temperature: trigger.event === 'Extreme Heatwave' ? 44 : 31
    };
    const aiPrediction = TrustpayMLEngine.predictPayoutAdaptive(user, {}, weatherData, planType);

    // Generate claim ID immediately
    const claimID = `TRP-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${
      Math.floor(Math.random() * 9000 + 1000)}`;

    return {
      claimID,
      event:         trigger.event,
      payout:        aiPrediction.approved ? aiPrediction.finalPayout : (estimatedPayout || 0),
      icon:          trigger.icon,
      source:        trigger.source,
      plan:          plan.name,
      aiPrediction:  aiPrediction
    };
  },

  // Auto process — update steps one by one
  async autoProcessClaim(claimID, trigger, user, plan, payout, onStepComplete, onProgressUpdate) {
    const { aiPrediction } = trigger; // Use prediction passed in trigger if available
    
    const steps = [
      { id: "zt-step-1", delay: 0,    name: "Disruption Verified",     detail: `${trigger.event} confirmed at your location` },
      { id: "zt-step-2", delay: 600,  name: "Location Auto-Detected",  detail: `${user.zone}, ${user.city} — GPS verified` },
      { id: "zt-step-3", delay: 1300, name: "Earnings Impact Focused", detail: `Est. loss ₹${trigger.estimatedLoss || 200} · Coverage ${Math.round(plan.coverageRate * 100)}%` },
      { id: "zt-step-4", delay: 2100, name: "Fraud Check Passed",      detail: `Fraud score ${aiPrediction?.fraudScore || 4}/100 — Clean ✅` },
      { id: "zt-step-5", delay: 2900, name: "Policy Coverage Applied", detail: `${plan.name} Plan · Payout ₹${payout} approved` },
    ];

    for (const step of steps) {
      await this.delay(step.delay);
      onStepComplete(step);
      onProgressUpdate(((steps.indexOf(step) + 1) / steps.length) * 80);
    }

    await this.delay(3600);
    onProgressUpdate(100);
    
    // Add to claim history
    this.recordClaim(claimID, trigger, user, plan, payout, aiPrediction);

    return { claimID, payout };
  },

  recordClaim(claimID, trigger, user, plan, payout, aiPrediction) {
    const newClaim = {
      id:           claimID,
      date:         new Date().toISOString().slice(0,10),
      displayDate:  new Date().toLocaleDateString("en-IN",
                    { day:"numeric", month:"short", year:"numeric" }),
      event:        trigger.event,
      zone:         user.zone,
      incomeLoss:   trigger.estimatedLoss || 200,
      coverageRate: plan.coverageRate,
      approvedPayout: payout,
      status:       "paid",
      payoutTime:   "Auto — Zero Touch",
      upiTxnID:     "TXN" + Date.now(),
      fraudScore:   aiPrediction?.fraudScore || 4,
      aiConfidence: aiPrediction?.confidence || 97.2,
      modelVersion: aiPrediction?.modelVersion || "trustpay-ml-v1",
      source:       trigger.source,
      zeroTouch:    true,
      aiFeatures:   aiPrediction?.features || {}
    };
    TrustpayDB.claims.unshift(newClaim);
    TrustpayDB.currentUser.totalClaimsCount = (TrustpayDB.currentUser.totalClaimsCount || 0) + 1;
  },

  getActiveTrigger(triggerID) {
    const stored = sessionStorage.getItem("trigger_" + triggerID);
    return stored ? JSON.parse(stored) : null;
  },

  delay: (ms) => new Promise((r) => setTimeout(r, ms)),
};
