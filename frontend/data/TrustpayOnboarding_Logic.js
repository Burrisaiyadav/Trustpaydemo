// src/data/TrustpayOnboarding_Logic.js
import { TrustpayDB } from './TrustpayData.js';
import { TrustpayDynamicPricing } from './TrustpayAI_Engine.js';

const TrustpayOnboarding = {

  MONITORING_DAYS: 7,

  getMonitoringStatus(userData) {
    const joinDate  = new Date(userData?.planActivatedOn || userData?.createdAt
                               || new Date(Date.now() - 3 * 86400000));
    const today     = new Date();
    const daysActive = Math.floor((today - joinDate) / 86400000);
    const remaining  = Math.max(0, this.MONITORING_DAYS - daysActive);
    const complete   = daysActive >= this.MONITORING_DAYS;

    const recentEarnings = TrustpayDB.dailyEarnings.slice(-7);
    const activeDays     = recentEarnings.filter(d => d.earnings > 0).length;
    const avgEarnings    = recentEarnings.reduce((s,d) => s+d.earnings, 0)
                           / (recentEarnings.length || 1);
    const consistency    = activeDays / 7;

    return {
      complete,
      daysActive,
      daysRemaining: remaining,
      progressPct:   Math.min((daysActive / this.MONITORING_DAYS) * 100, 100),
      activeDays,
      avgEarnings:   Math.round(avgEarnings),
      consistency,
      metrics: {
        totalEarnings7d: Math.round(avgEarnings * 7),
        avgDailyEarnings: Math.round(avgEarnings),
        activeDaysCount:  activeDays,
        consistencyScore: Math.round(consistency * 100),
        peakEarningDay:   recentEarnings.reduce((max, d) =>
          d.earnings > (max?.earnings || 0) ? d : max, null),
      },
    };
  },

  getRecommendedPlanAfterMonitoring(monitoringStatus) {
    const { metrics } = monitoringStatus;
    const avg = metrics.avgDailyEarnings;
    const consistency = metrics.consistencyScore;
    const zone = TrustpayDB.currentUser?.zone || "Kondapur";
    const zoneRisk = TrustpayDB.zoneRiskMap[zone]?.riskScore || 50;

    let plan, reason;

    if (avg >= 1500 || zoneRisk >= 70 || consistency >= 85) {
      plan   = "pro";
      reason = `High earnings (₹${avg}/day) and ${zoneRisk}% zone risk — Pro gives maximum protection`;
    } else if (avg >= 900 || consistency >= 65) {
      plan   = "standard";
      reason = `Moderate earnings (₹${avg}/day) — Standard gives best value at ₹35/week`;
    } else {
      plan   = "lite";
      reason = `Entry level coverage — start with Lite at ₹20/week, upgrade anytime`;
    }

    return { plan, reason, metrics };
  },
};

export default TrustpayOnboarding;
