import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TrustpayDB } from '../data/TrustpayData.js';
import { TrustpayDynamicPricing, TrustpayTriggers, TrustpayZeroTouch } from '../data/TrustpayAI_Engine.js';
import { h3Index } from '../utils/h3_simulator.js';
import './AIEngine.css';

// ════════════════════════════════════════════════════
// DISRUPTION BANNER — appears when a trigger fires
// ════════════════════════════════════════════════════
export const DisruptionBanner = ({ trigger, onClaim, onDismiss }) => {
  const user = TrustpayDB.currentUser;
  const plan = TrustpayDB.plans[user.plan || 'standard'];
  const payout = Math.round(trigger.estimatedLoss * plan.coverageRate);

  return (
    <div className="disruption-banner" style={{ borderLeftColor: trigger.color }}>
      <div className="db-left">
        <span className="db-icon">{trigger.icon}</span>
        <div className="db-info">
          <div className="db-event">
            <span className={`db-severity severity-${trigger.severity.toLowerCase()}`}>
              {trigger.severity}
            </span>
            {trigger.event} Detected
          </div>
          <div className="db-detail">{trigger.detail}</div>
          <div className="db-source">📡 Source: {trigger.source}</div>
        </div>
      </div>
      <div className="db-right">
        <div className="db-payout-preview">
          <span className="db-payout-label">Est. Payout</span>
          <span className="db-payout-amount">₹{payout}</span>
        </div>
        <button className="db-claim-btn" onClick={() => onClaim(trigger, payout)}>
          ⚡ Claim Now
        </button>
        <button className="db-dismiss" onClick={onDismiss}>✕</button>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════
// H3 GEOSPATIAL RISK MAP — visualized grid
// ════════════════════════════════════════════════════
export const H3RiskMap = ({ city = 'Hyderabad', zone = 'Kondapur', isDisrupted = false }) => {
  const hexSize = 35;
  const workerHex = useMemo(() => h3Index.getHexForLocation(zone, city), [zone, city]);
  const neighbors = useMemo(() => h3Index.getNeighbors(workerHex), [workerHex]);
  
  const generateHexPath = (x, y, size) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      points.push(`${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`);
    }
    return `M ${points.join(' L ')} Z`;
  };

  const grid = [
    { x: 100, y: 70,  id: neighbors[0] },
    { x: 160, y: 70,  id: neighbors[1] },
    { x: 70,  y: 120, id: neighbors[2] },
    { x: 130, y: 120, id: workerHex, isWorker: true },
    { x: 190, y: 120, id: neighbors[3] },
    { x: 100, y: 170, id: neighbors[4] },
    { x: 160, y: 170, id: neighbors[5] },
  ];

  return (
    <div className="h3-grid-container">
      <div className="h3-hex-layer">
        <svg width="300" height="240" viewBox="0 0 300 240">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {grid.map((h, i) => (
            <path
              key={i}
              d={generateHexPath(h.x, h.y, hexSize)}
              className={`h3-hex ${h.isWorker ? 'h3-hex-worker' : ''} ${isDisrupted && (h.isWorker || i % 3 === 0) ? 'h3-hex-disrupted' : ''}`}
              style={{ filter: h.isWorker ? 'url(#glow)' : 'none' }}
            />
          ))}
          {/* Worker pulsing dot */}
          <circle cx="130" cy="120" r="4" fill="var(--accent-cyan)" className="animate-pulse" />
        </svg>
      </div>
      <div className="h3-info-overlay">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={`h3-status-dot ${isDisrupted ? 'disrupted' : ''}`} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFF' }}>
            {isDisrupted ? 'ZONE DISRUPTED' : 'ZONE STABLE'}
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
          HEX: {workerHex}
        </span>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════
// ZERO-TOUCH CLAIM OVERLAY — full-screen auto-process
// ════════════════════════════════════════════════════
export const ZeroTouchOverlay = ({ trigger, onComplete }) => {
  const user = TrustpayDB.currentUser;
  const plan = TrustpayDB.plans[user.plan || 'standard'];
  const payout = Math.round(trigger.estimatedLoss * plan.coverageRate);

  const [completedSteps, setCompletedSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Processing claim...');
  const [claimResult, setClaimResult] = useState(null);
  const [countUp, setCountUp] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    runProcess();
  }, []);

  const runProcess = async () => {
    const claimInit = await TrustpayZeroTouch.initiateSingleTapClaim(trigger.triggerID, payout, trigger);
    
    const result = await TrustpayZeroTouch.autoProcessClaim(
      claimInit.claimID,
      trigger,
      user,
      plan,
      payout,
      (step) => setCompletedSteps(prev => [...prev, step]),
      (pct) => {
        setProgress(pct);
        if (pct < 100) setProgressLabel(`AI Signal Verification: ${Math.round(pct)}%...`);
        else setProgressLabel('Initiating instant transfer...');
      }
    );

    setClaimResult(result);
    // Count-up animation
    let count = 0;
    const interval = setInterval(() => {
      count += result.payout / 40;
      if (count >= result.payout) {
        count = result.payout;
        clearInterval(interval);
        triggerConfetti();
      }
      setCountUp(Math.round(count));
    }, 15);

    // Auto-close after 8s
    setTimeout(() => onComplete(result), 8000);
  };

  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: -10,
      vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3 + 2,
      color: ['#10B981', '#2563EB', '#F59E0B', '#FFFFFF'][Math.floor(Math.random() * 4)],
      size: Math.random() * 6 + 3, angle: Math.random() * 360, spin: (Math.random() - 0.5) * 10, vy0: 0,
    }));
    let frame = 0;
    const animate = () => {
      if (frame++ > 120) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.angle += p.spin; p.vy += 0.1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle * Math.PI / 180);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      requestAnimationFrame(animate);
    };
    animate();
  };

  return (
    <div className="zt-overlay">
      <div className="zt-card">
        <canvas ref={canvasRef} className="zt-confetti-canvas" />
        <div className="zt-header">
          <span className="zt-event-icon">{trigger.icon}</span>
          <h2 className="zt-title">Parametric Payout</h2>
          <p className="zt-subtitle">AI-Verified Zone Disruption Trigger</p>
        </div>

        {!claimResult && (
          <div className="zt-steps">
            {[
              { id: "zt-step-1", name: 'Disruption Verified' },
              { id: "zt-step-2", name: 'Location Auto-Detected' },
              { id: "zt-step-3", name: 'Earnings Impact Focused' },
              { id: "zt-step-4", name: 'Fraud Check Passed' },
              { id: "zt-step-5", name: 'Policy Coverage Applied' },
            ].map(s => {
              const completed = completedSteps.find(cs => cs.id === s.id);
              return (
                <div key={s.id} className={`zt-step ${completed ? 'zt-step-done' : ''}`}>
                  <div className="zt-step-icon">
                    {completed ? '✅' : <span className="zt-spinner-mini"></span>}
                  </div>
                  <div className="zt-step-content">
                    <span className="zt-step-name">{s.name}</span>
                    <span className="zt-step-detail">{completed ? completed.detail : 'Verifying...'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="zt-progress-track">
          <div className="zt-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="zt-progress-label">{progressLabel}</p>

        {claimResult && (
          <div className="zt-payout-result">
            <div className="zt-check">✓</div>
            <div className="zt-approved-label">INSTANT REIMBURSEMENT</div>
            <div className="zt-amount">₹{countUp}</div>
            <div className="zt-upi">Sent to {user.upiID || 'your UPI'}</div>
            <div className="zt-claimid">Parametric ID: {claimResult.claimID}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════
// AI DYNAMIC PRICING BANNER — for Plans Page
// ════════════════════════════════════════════════════
export const DynamicPricingBanner = ({ pricingData }) => {
  if (!pricingData) return null;
  const { factors, confidenceScore, breakdown } = pricingData;
  const activeFactors = factors.filter(f => f.adjustment !== 0);

  return (
    <div className="dynamic-pricing-banner">
      <div className="dp-header">
        <div className="dp-icon">🤖</div>
        <div className="dp-title-info">
          <h3>AI-Personalised Pricing</h3>
          <p>Your premium is adjusted based on {activeFactors.length} key risk factors</p>
        </div>
        <div className="dp-confidence">{confidenceScore}% confidence</div>
      </div>

      <div className="dp-factors-grid">
        {activeFactors.map((factor, i) => (
          <div key={i} className={`dp-factor-pill ${factor.positive ? 'dp-pill-positive' : 'dp-pill-negative'}`}>
            <span className="dp-factor-icon">{factor.icon}</span>
            <div className="dp-pill-text">
               <span className="dp-factor-name">{factor.name}</span>
               <span className={`dp-factor-adj ${factor.positive ? 'adj-positive' : 'adj-negative'}`}>
                 {factor.adjustment > 0 ? '+' : ''}{factor.adjustment}
               </span>
            </div>
          </div>
        ))}
      </div>

      {breakdown.summary && (
        <div className="dp-summary-pill">
          ✨ {breakdown.summary}
        </div>
      )}

      <p className="dp-sources">
        📡 Data: IMD Flood Zones · OpenWeatherMap · Traffic Index · AccuWeather · Trustpay Records
      </p>
    </div>
  );
};

// ════════════════════════════════════════════════════
// DASHBOARD TRIGGER HOOK — starts watchers, manages state
// ════════════════════════════════════════════════════
export const useDashboardTriggers = () => {
  const [activeTriggers, setActiveTriggers] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  useEffect(() => {
    const user    = TrustpayDB.currentUser || {};
    const location = { lat: user.coordinates?.lat, lng: user.coordinates?.lng, zone: user.zone || 'Kondapur' };

    const unsubscribe = TrustpayTriggers.onTriggerFired((triggerData) => {
      setActiveTriggers(prev => {
        if (prev.find(t => t.triggerID === triggerData.triggerID)) return prev;
        return [triggerData, ...prev].slice(0, 3);
      });
    });

    TrustpayTriggers.startAllTriggers(user, location);

    return () => {
      unsubscribe();
      TrustpayTriggers.stopAllTriggers();
    };
  }, []);

  const dismissTrigger = (triggerID) => {
    setActiveTriggers(prev => prev.filter(t => t.triggerID !== triggerID));
    setDismissedIds(prev => new Set([...prev, triggerID]));
  };

  return { activeTriggers, dismissTrigger };
};
