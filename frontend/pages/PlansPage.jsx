import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CheckCircle, MapPin, ChevronDown, ChevronUp, Loader2, Shield, Clock, Activity, TrendingUp } from 'lucide-react';
import api from '../services/api.js';
import { TrustpayDB } from '../data/TrustpayData.js';
import { TrustpayDynamicPricing } from '../data/TrustpayAI_Engine.js';
import { DynamicPricingBanner } from '../components/AIEngineComponents.jsx';
import TrustpayOnboarding from '../data/TrustpayOnboarding_Logic';
import TrustpayRealTime from '../data/TrustpayRealTime';

const PlansPage = () => {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [recommendedPlanId, setRecommendedPlanId] = useState('standard');
  const [zoneData, setZoneData] = useState({});
  const [selectedZone, setSelectedZone] = useState('Kondapur');
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [aiPricing, setAiPricing] = useState({});
  const [bonusCoverage, setBonusCoverage] = useState({});
  const [masterPricing, setMasterPricing] = useState(null);
  const [selectedCovers, setSelectedCovers] = useState(['Rain', 'AQI']);
  const [customPremium, setCustomPremium] = useState(25);
  const [monitoringStatus, setMonitoringStatus] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [meRes, plansRes] = await Promise.all([
          api.getMe(),
          api.getPlans(),
        ]);
        const userData = meRes.user || TrustpayDB.currentUser;
        setUser(userData);

        // ── 7-DAY MONITORING CHECK ──
        const mStatus = TrustpayOnboarding.getMonitoringStatus(userData);
        setMonitoringStatus(mStatus);

        // Use API plans or fall back to TrustpayDB if backend is offline
        const rawPlans = plansRes.plans && plansRes.plans.length > 0
          ? plansRes.plans
          : Object.values(TrustpayDB.plans);
        setPlans(rawPlans);
        setRecommendedPlanId(plansRes.recommendedPlan || 'standard');
        setZoneData(plansRes);
        const zone = meRes.user?.zone || 'Kondapur';
        setSelectedZone(zone);

        // Calculate AI pricing for all plans after user data is available
        const locationData = { zone };
        const pricing = {};
        const bonus = {};
        
        await Promise.all(['lite', 'standard', 'pro'].map(async (planType) => {
          pricing[planType] = await TrustpayDynamicPricing.calculatePersonalizedPremiumAsync(planType, userData, locationData);
          bonus[planType]   = TrustpayDynamicPricing.calculateBonusCoverageHours(userData, locationData);
        }));
        
        setAiPricing(pricing);
        setBonusCoverage(bonus);
        setMasterPricing(pricing['standard']); // use standard plan for the banner
        setLoading(false);
      } catch (err) {
        console.error('Plans Page load error:', err);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSelectPlan = async (planId) => {
    try {
      await api.updateProfile({ plan: planId });
      const meRes = await api.getMe();
      setUser(meRes.user);
      alert(`Successfully switched to ${planId.toUpperCase()} plan.`);
    } catch (e) {
      console.error(e);
      alert('Failed to update plan.');
    }
  };

  if (loading || !user || !monitoringStatus) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '24px', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} className="animate-spin" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>Analyzing Account Activity...</p>
        </div>
      </div>
    );
  }

  // ── RENDER MONITORING SCREEN IF INCOMPLETE ──
  if (!monitoringStatus.complete && !user.plan) {
    const recommendation = TrustpayOnboarding.getRecommendedPlanAfterMonitoring(monitoringStatus);
    return (
      <div className="monitoring-page animate-fade-in-up">
        <div className="monitoring-card glass-panel">
          <div className="mon-header">
            <div className="mon-shield">🛡️</div>
            <h2>Verify Your Worker Profile</h2>
            <p>We monitor your activity for 7 days to calculate your personalized AI risk score and premium.</p>
          </div>

          <div className="mon-progress-ring">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="80" fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle cx="90" cy="90" r="80" fill="none" stroke="var(--accent-cyan)" strokeWidth="8"
                strokeDasharray={`${(monitoringStatus.progressPct / 100) * 502} 502`}
                strokeLinecap="round" transform="rotate(-90 90 90)" />
            </svg>
            <div className="mon-ring-label">
              <span className="mon-days-done">{monitoringStatus.daysActive}</span>
              <span className="mon-days-total">OF 7 DAYS</span>
            </div>
          </div>

          <div className="mon-waiting">
             <Clock size={18} />
             <span>Monitoring in progress... {monitoringStatus.daysRemaining} days left</span>
          </div>

          <div className="mon-metrics">
            <div className="mon-metric">
              <span className="mm-label">Avg. Earnings</span>
              <span className="mm-value">₹{monitoringStatus.avgEarnings}/day</span>
            </div>
            <div className="mon-metric">
              <span className="mm-label">Consistency</span>
              <span className="mm-value">{monitoringStatus.metrics.consistencyScore}%</span>
            </div>
          </div>

          <div className="mon-info">
            <p><strong>Why the 7-day wait?</strong></p>
            <p style={{ opacity: 0.8 }}>Trustpay is built on high-trust data. By observing your patterns, our AI can offer you lower premiums than traditional insurance.</p>
          </div>

          <div className="mon-recommendation glass-panel" style={{ marginTop: '24px', background: 'rgba(37, 99, 235, 0.05)' }}>
             <div className="rec-header">
               <Activity size={18} color="var(--accent-cyan)" />
               <h3>Current AI Prediction</h3>
             </div>
             <div className="rec-plan-badge">PRELIMINARY: {recommendation.plan.toUpperCase()}</div>
             <div className="rec-price">
               <span className="rec-price-crossed">₹{TrustpayDynamicPricing.BASE_PREMIUMS[recommendation.plan]}</span>
               <span className="rec-price-ai">₹{Math.round(TrustpayDynamicPricing.BASE_PREMIUMS[recommendation.plan] * 0.8)}</span>
               <span className="rec-period">/week</span>
               <span className="rec-savings">AI SAVE 20%</span>
             </div>
             <p className="rec-reason">{recommendation.reason}</p>
             <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
               *Your final price may change based on the remaining {monitoringStatus.daysRemaining} days of data.
             </div>
          </div>

          <Button variant="outline" style={{ width: '100%', marginTop: '32px' }} onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const activePlanId = user.plan || user.policy?.planType;
  const currentZoneData = zoneData || {};

  const faqs = [
    { q: "How soon do I get paid after a weather event?", a: `For Standard and Pro plans, payouts are processed automatically via UPI within 45 minutes. Lite plan takes up to 2 hours.` },
    { q: "Can I cancel my plan anytime?", a: "Yes. All our plans are weekly. You can turn off auto-renew at any time with no cancellation fees." },
    { q: "What counts as 'Heavy Rain' or 'Heatwave'?", a: "We use live OpenWeatherMap radar data. If rainfall exceeds 15mm/hr during your active hours, it triggers a claim." },
    { q: "Do I need to submit photos to claim?", a: "No! Trustpay is 100% zero-touch. Our AI detects the disruption in your zone and automatically triggers the payout." },
  ];

  // If user has an active plan, ONLY show that plan
  const plansToDisplay = activePlanId && plans.some(p => p.id === activePlanId) ? plans.filter(p => p.id === activePlanId) : plans;

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>
          {activePlanId ? 'Your Active Policy' : 'Choose Your Protection Plan'}
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
          {activePlanId ? `Your dynamically priced coverage in ${user.city}.` : `AI-recommended based on your zone in ${user.city}, history, and pattern.`}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', marginBottom: '64px', alignItems: 'start' }}>
        {/* Personalized Coverage Builder */}
        <Card glow style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>🛠️ Personalised Coverage Builder</h2>
            <Badge variant="cyan">BETA</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Pick only the disruptions that affect <strong>your</strong> work. Your premium updates in real-time.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {[
              { id: 'Rain', icon: '🌧️', label: 'Heavy Rain', price: 8 },
              { id: 'AQI', icon: '🌫️', label: 'AQI Spikes', price: 5 },
              { id: 'Traffic', icon: '🚧', label: 'Road Blocks', price: 4 },
              { id: 'Heat', icon: '☀️', label: 'Heatwaves', price: 6 },
              { id: 'Curfew', icon: '🚨', label: 'Shutdowns', price: 7 },
            ].map(cover => {
              const isSelected = selectedCovers.includes(cover.id);
              return (
                <button
                  key={cover.id}
                  onClick={() => {
                    const next = isSelected ? selectedCovers.filter(i => i !== cover.id) : [...selectedCovers, cover.id];
                    setSelectedCovers(next);
                    setCustomPremium(next.reduce((sum, item) => sum + ([
                      { id: 'Rain', p: 8 }, { id: 'AQI', p: 5 }, { id: 'Traffic', p: 4 }, { id: 'Heat', p: 6 }, { id: 'Curfew', p: 7 }
                    ].find(i => i.id === item)?.p || 0), 10)); // 10 is base platform fee
                  }}
                  style={{
                    padding: '24px 16px',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <span style={{ fontSize: '32px' }}>{cover.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>{cover.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+₹{cover.price}/week</span>
                </button>
              );
            })}
          </div>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Custom Weekly Premium</div>
              <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--accent-cyan)' }}>₹{customPremium}</div>
            </div>
            <Button variant="primary" glow disabled={selectedCovers.length === 0}>
              Activate Custom Plan →
            </Button>
          </div>
        </Card>

        {/* Loyalty & Rewards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: 'white' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⭐ Trustpay Rewards
            </h3>
            <div style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>₹{user.rewardsBalance || 450}</div>
            <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '20px' }}>Loyalty credits earned from safe, disruption-free work weeks.</p>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span>Next Milestone: ₹500</span>
                <span>90%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px' }}>
                <div style={{ width: '90%', height: '100%', background: 'white', borderRadius: '3px' }} />
              </div>
            </div>
            <Button variant="outline" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}>
              Redeem Credits
            </Button>
          </Card>

          <Card>
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>LOYALTY PERKS</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'No-claim bonus (4 weeks)', value: '15% Cashback' },
                { label: 'Early Adopter Status', value: 'Lvl 3 Active' },
                { label: 'Multi-Platform Consistency', value: '+₹50 Credit' },
              ].map((perk, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{perk.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{perk.value}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <DynamicPricingBanner pricingData={masterPricing} />

      {!activePlanId && (
        <Card glow style={{ marginBottom: '32px', background: 'rgba(37, 99, 235, 0.03)', borderColor: 'var(--accent-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '32px' }}>🤖</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '18px', color: 'var(--accent-cyan)' }}>AI Recommendation for {user.name?.split(' ')[0]}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Based on your zone ({selectedZone}, Risk Score: {zoneData.userZoneRisk || 55}) and {user.activeDays}-day history, we recommend the <strong>{(plans.find(p => p.id === recommendedPlanId)?.name || 'Standard')} Plan</strong>.</div>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '12px 24px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)' }}>
          <MapPin size={20} color="var(--accent-cyan)" />
          <span style={{ color: 'var(--text-secondary)' }}>Your Active Zone:</span>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>{selectedZone}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', gap: '32px', flexWrap: 'wrap', marginBottom: '80px' }}>
        {plansToDisplay.map(plan => {
          const isRecommended = recommendedPlanId === plan.id;
          const isPro = plan.id === 'pro';
          const isLite = plan.id === 'lite';
          
          return (
            <div 
              key={plan.id}
              style={{
                flex: '1 1 300px',
                maxWidth: isRecommended ? '400px' : '350px',
                transform: isRecommended ? 'scale(1.05) translateY(-10px)' : 'none',
                position: 'relative',
                background: isRecommended 
                  ? 'linear-gradient(145deg, rgba(37,99,235,0.06), rgba(5,150,105,0.04))'
                  : 'var(--bg-card)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: isRecommended ? '2px solid rgba(0,224,255,0.4)' : '1px solid var(--border)',
                boxShadow: isRecommended 
                  ? '0 32px 80px -12px rgba(37,99,235,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' 
                  : '0 8px 32px -8px rgba(0,0,0,0.1)',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!isRecommended) e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = isRecommended 
                  ? '0 40px 100px -12px rgba(37,99,235,0.3)' 
                  : '0 16px 40px -8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = isRecommended ? 'scale(1.05) translateY(-10px)' : 'none';
                e.currentTarget.style.boxShadow = isRecommended 
                  ? '0 32px 80px -12px rgba(37,99,235,0.2)' 
                  : '0 8px 32px -8px rgba(0,0,0,0.1)';
              }}
            >
              {isRecommended && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-green))' }} />
              )}
              {isRecommended && (
                <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'linear-gradient(135deg, var(--accent-cyan), #059669)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, letterSpacing: '1px', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                  RECOMMENDED
                </div>
              )}
              
              <h3 style={{ 
                fontSize: '22px', 
                fontWeight: 800, 
                letterSpacing: '0.5px',
                background: isPro ? 'linear-gradient(90deg, #F59E0B, #D97706)' : (isRecommended ? 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))' : 'var(--text-primary)'),
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px'
              }}>
                {plan.name.toUpperCase()} PLAN
              </h3>
              
              {/* AI Dynamic Price Block */}
              {aiPricing[plan.id] ? (
                <div className="plan-price-block" style={{ margin: '16px 0 24px' }}>
                  {aiPricing[plan.id].savedVsBase > 0 && (
                    <span className="strike-price">₹{aiPricing[plan.id].basePremium}</span>
                  )}
                  <div style={{ display: 'inline-block' }}>
                    <span className="ai-price-tag" style={{ fontSize: '42px' }}>₹{aiPricing[plan.id].finalPremium}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '4px' }}>/week</span>
                  </div>
                  {aiPricing[plan.id].savedVsBase > 0 && (
                    <div className="dp-summary-pill" style={{ display: 'block', padding: '4px 12px', fontSize: '11px', marginTop: '8px', marginBottom: '8px' }}>
                      AI saved you ₹{aiPricing[plan.id].savedVsBase}
                    </div>
                  )}
                  {bonusCoverage[plan.id]?.bonusHours > 0 && (
                    <div className="bonus-hours-badge">
                      ⚡ +{bonusCoverage[plan.id].bonusHours} bonus coverage hours
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '48px', fontWeight: 700, margin: '16px 0' }}>
                  ₹{plan.weeklyPremium}<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/week</span>
                </div>
              )}
            
              <div style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px dashed var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Coverage up to</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  ₹{plan.maxWeeklyCoverage}<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/week</span>
                </div>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={18} color={isRecommended ? "var(--accent-cyan)" : "var(--accent-green)"} style={{ flexShrink: 0, marginTop: '2px' }}/> 
                  <span><strong style={{ color: 'var(--text-primary)' }}>Events:</strong> {plan.events.join(', ')}</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={18} color={isRecommended ? "var(--accent-cyan)" : "var(--accent-green)"} style={{ flexShrink: 0 }}/> 
                  <span><strong style={{ color: 'var(--text-primary)' }}>Max Claims:</strong> {plan.claimsPerMonth === 999 ? 'Unlimited' : plan.claimsPerMonth} / mo</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={18} color={isRecommended ? "var(--accent-cyan)" : "var(--accent-green)"} style={{ flexShrink: 0 }}/> 
                  <span><strong style={{ color: 'var(--text-primary)' }}>Payout:</strong> {plan.payoutTime}</span>
                </li>
                {plan.features.slice(0, 1).map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <CheckCircle size={18} color={isRecommended ? "var(--accent-cyan)" : "var(--accent-green)"} style={{ flexShrink: 0, marginTop: '2px' }}/> 
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            
              {(() => {
                const isActive = (user.plan || user.policy?.planType) === plan.id;
                return (
                  <button 
                    onClick={() => { if (!isActive) handleSelectPlan(plan.id); }}
                style={{ 
                  width: '100%', 
                  marginTop: 'auto',
                  padding: '16px',
                  borderRadius: '16px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: isActive ? 'default' : 'pointer',
                  border: isActive ? '1px solid var(--accent-cyan)' : (isPro ? '1px solid rgba(245, 158, 11, 0.4)' : (isRecommended ? 'none' : '1px solid var(--border)')),
                  background: isActive ? 'rgba(34, 211, 238, 0.1)' : (isRecommended ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))' : 'transparent'),
                  color: isActive ? 'var(--accent-cyan)' : (isRecommended ? 'white' : (isPro ? 'var(--accent-gold)' : 'var(--text-primary)')),
                  boxShadow: (!isActive && isRecommended) ? '0 12px 24px -8px rgba(37,99,235,0.4)' : 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-body)'
                }}
                onMouseOver={(e) => {
                  if (isActive) return;
                  if (isRecommended) e.currentTarget.style.boxShadow = '0 16px 32px -8px rgba(37,99,235,0.6)';
                  if (!isRecommended) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseOut={(e) => {
                  if (isActive) return;
                  if (isRecommended) e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(37,99,235,0.4)';
                  if (!isRecommended) e.currentTarget.style.background = 'transparent';
                }}
              >
                {isActive ? 'Current Plan — Active' : `Select ${plan.name}`}
              </button>
                );
              })()}
            </div>
          );
        })}
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', textAlign: 'center', marginBottom: '40px' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((faq, index) => (
            <Card key={index} hover={false} style={{ padding: '0' }}>
              <button 
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                style={{
                  width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)',
                  padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '18px', fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--font-body)'
                }}
              >
                {faq.q}
                {expandedFaq === index ? <ChevronUp /> : <ChevronDown />}
              </button>
              {expandedFaq === index && (
                <div className="animate-fade-in-up" style={{ padding: '0 24px 24px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
