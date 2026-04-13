// src/data/TrustpayRealTime.js
import { TrustpayDB, TrustpayComputed } from './TrustpayData.js';
import { TrustpayTriggers } from './TrustpayAI_Engine.js'; // Assuming this exists or is accessible

const TrustpayRealTime = {

  intervals:  [],
  lastUpdate: null,
  sources:    {},

  // Start all real-time data streams
  startRealTimeUpdates() {
    console.log("[Trustpay] Starting real-time dashboard updates...");

    // Initial load
    this.refreshAllData();

    // 1. Weather update every 10 minutes
    this.startWeatherStream();

    // 2. Earnings estimate update every 5 minutes
    this.startEarningsStream();

    // 3. Risk score update every 2 minutes
    this.startRiskStream();

    // 4. Claim status polling every 30 seconds
    this.startClaimPolling();

    // 5. Trigger monitoring every 60 seconds
    this.startTriggerMonitoring();

    // 6. Live ticker (seconds counter on dashboard)
    this.startLiveTicker();
  },

  stopRealTimeUpdates() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  },

  // ── WEATHER STREAM ──
  startWeatherStream() {
    const run = async () => {
      try {
        const user = TrustpayDB.currentUser;
        const data = this.mockWeatherData(new Date().getHours(), user.city);
        TrustpayDB.liveWeather = data;
        this.updateWeatherDisplay(data);
        this.sources.weather = new Date();
        window.dispatchEvent(new CustomEvent('trustpay-weather-update', { detail: data }));
      } catch (err) {
        console.warn("[RT] Weather update failed:", err);
      }
    };
    run();
    const id = setInterval(run, 600000); // 10 min
    this.intervals.push(id);
  },

  mockWeatherData(hour, city) {
    const CITY_WEATHER = {
      "Hyderabad": { baseTemp:32, rainHours:[15,16,17,18,19] },
      "Bengaluru": { baseTemp:28, rainHours:[14,15,16,17]    },
      "Mumbai":    { baseTemp:30, rainHours:[13,14,15,16,17,18] },
      "Chennai":   { baseTemp:34, rainHours:[16,17,18,19]    },
      "Delhi":     { baseTemp:36, rainHours:[14,15]           },
      "Pune":      { baseTemp:29, rainHours:[15,16,17]        },
    };
    const cfg     = CITY_WEATHER[city] || CITY_WEATHER["Hyderabad"];
    const isRain  = cfg.rainHours.includes(hour);
    const temp    = cfg.baseTemp + (Math.random() * 4 - 2);
    const humid   = isRain ? 85 + Math.random() * 10 : 55 + Math.random() * 15;
    const rainfall = isRain ? 15 + Math.random() * 35 : 0;

    return {
      event:       isRain ? (rainfall > 30 ? "Heavy Rain" : "Moderate Rain") :
                   temp > 42 ? "Heatwave" : "Clear",
      temperature: Math.round(temp * 10) / 10,
      humidity:    Math.round(humid),
      rainfall:    Math.round(rainfall * 10) / 10,
      windSpeed:   Math.round((5 + Math.random() * 20) * 10) / 10,
      description: isRain ? "Rain showers expected" : "Clear skies",
      fetchedAt:   new Date().toISOString(),
      isLive:      true,
    };
  },

  updateWeatherDisplay(data) {
    // This will be handled by components listening to state or events
  },

  // ── EARNINGS STREAM ──
  startEarningsStream() {
    const run = () => {
      const hour     = new Date().getHours();
      const today    = new Date().toISOString().slice(0,10);
      const existing = TrustpayDB.dailyEarnings.find(d => d.date === today);

      const baseByHour = {
        6:120, 7:180, 8:280, 9:380, 10:450, 11:520,
        12:640, 13:720, 14:780, 15:820, 16:860, 17:920,
        18:1050, 19:1180, 20:1280, 21:1340, 22:1380, 23:1400,
      };
      const estimate = baseByHour[hour] || 0;
      const variance = estimate * (1 + (Math.random() * 0.1 - 0.05));
      const todayEarnings = Math.round(variance);

      if (existing) {
        existing.earnings = todayEarnings;
      } else {
        TrustpayDB.dailyEarnings.push({
          date: today, day: new Date().toLocaleDateString("en-IN",{weekday:"short"}),
          earnings: todayEarnings, protected: 0, weather: "Clear", risk: "low",
        });
        if (TrustpayDB.dailyEarnings.length > 30) TrustpayDB.dailyEarnings.shift();
      }

      window.dispatchEvent(new CustomEvent('trustpay-earnings-update', { detail: { todayEarnings } }));
      this.sources.earnings = new Date();
    };
    run();
    const id = setInterval(run, 300000); // 5 min
    this.intervals.push(id);
  },

  // ── RISK STREAM ──
  startRiskStream() {
    const run = () => {
      const hour    = new Date().getHours();
      const weather = TrustpayDB.liveWeather || {};
      const zone    = TrustpayDB.currentUser?.zone || "Kondapur";

      let score = 30;
      if (hour >= 16 && hour <= 20) score += 20;
      if (weather.event === "Heavy Rain") score += 30;
      if (weather.event === "Moderate Rain") score += 15;
      if (weather.event === "Heatwave") score += 20;
      if (weather.rainfall > 30) score += 10;

      const ZONE_BASE_RISK = {
        "Kondapur":56,"Gachibowli":50,"HITEC City":55,
        "Kukatpally":68,"Banjara Hills":30,"Jubilee Hills":28,
        "Madhapur":42,"Secunderabad":44,
      };
      score += (ZONE_BASE_RISK[zone] || 50) * 0.3;
      score  = Math.min(Math.round(score), 100);

      TrustpayDB.liveRiskScore = score;
      window.dispatchEvent(new CustomEvent('trustpay-risk-update', { detail: { score } }));
      this.sources.risk = new Date();
    };
    run();
    const id = setInterval(run, 120000); // 2 min
    this.intervals.push(id);
  },

  // ── CLAIM POLLING ──
  startClaimPolling() {
    const run = () => {
      const processing = TrustpayDB.claims.filter(c => c.status === "processing");
      processing.forEach(claim => {
        const minutesSince = (new Date() - new Date(claim.filedAt || new Date())) / 60000;
        if (minutesSince >= 2) {
          claim.status      = "paid";
          claim.processedAt = new Date().toISOString();
          claim.payout      = { txnID: "TXN" + Date.now(), completedAt: new Date().toISOString() };
          window.dispatchEvent(new CustomEvent('trustpay-claim-processed', { detail: claim }));
        }
      });
      this.sources.claims = new Date();
    };
    run();
    const id = setInterval(run, 30000); // 30s
    this.intervals.push(id);
  },

  // ── TRIGGER MONITORING ──
  startTriggerMonitoring() {
    const run = () => {
      const user     = TrustpayDB.currentUser;
      const location = {
        lat:  user.coordinates?.lat || 17.4726,
        lng:  user.coordinates?.lng || 78.3572,
        zone: user.zone,
      };
      if (TrustpayTriggers && TrustpayTriggers.runAllChecks) {
        TrustpayTriggers.runAllChecks(user, location);
      }
      this.sources.triggers = new Date();
    };
    run();
    const id = setInterval(run, 60000); // 60s
    this.intervals.push(id);
  },

  // ── LIVE TICKER ──
  startLiveTicker() {
    const run = () => {
      window.dispatchEvent(new CustomEvent('trustpay-ticker', { detail: { time: new Date().toLocaleTimeString("en-IN") } }));
    };
    run();
    const id = setInterval(run, 1000);
    this.intervals.push(id);
  },

  async refreshAllData() {
    // Initial sync
    console.log("[RT] Initial data refresh...");
  },
};

export default TrustpayRealTime;
