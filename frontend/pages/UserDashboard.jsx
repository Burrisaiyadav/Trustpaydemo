import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Shield, IndianRupee, TrendingUp, Star, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { DisruptionBanner, ZeroTouchOverlay, useDashboardTriggers, H3RiskMap } from '../components/AIEngineComponents.jsx';
import { h3Index } from '../utils/h3_simulator.js';
import TrustpayRealTime from '../data/TrustpayRealTime';
import { TrustpayDB, TrustpayComputed } from '../data/TrustpayData';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [claimStats, setClaimStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zeroTouchTrigger, setZeroTouchTrigger] = useState(null);
  const { activeTriggers, dismissTrigger } = useDashboardTriggers();

  // ── REAL-TIME STATE ──
  const [liveWeather, setLiveWeather] = useState(null);
  const [liveRisk, setLiveRisk] = useState(50);
  const [liveTicker, setLiveTicker] = useState(new Date().toLocaleTimeString("en-IN"));
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Start real-time engine
    TrustpayRealTime.startRealTimeUpdates();
    setIsLive(true);

    const onWeather = (e) => setLiveWeather(e.detail);
    const onRisk = (e) => setLiveRisk(e.detail.score);
    const onTicker = (e) => setLiveTicker(e.detail.time);
    const onEarnings = (e) => {
        // Force refresh data grid or update local kpis
        // For simplicity, we'll just trigger a component refresh
        setClaimStats(prev => ({...prev})); 
    };

    window.addEventListener('trustpay-weather-update', onWeather);
    window.addEventListener('trustpay-risk-update', onRisk);
    window.addEventListener('trustpay-ticker', onTicker);
    window.addEventListener('trustpay-earnings-update', onEarnings);

    return () => {
      TrustpayRealTime.stopRealTimeUpdates();
      window.removeEventListener('trustpay-weather-update', onWeather);
      window.removeEventListener('trustpay-risk-update', onRisk);
      window.removeEventListener('trustpay-ticker', onTicker);
      window.removeEventListener('trustpay-earnings-update', onEarnings);
    };
  }, []);

  useEffect(() => {
    const syncLocationAndLoad = async () => {
      try {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
            try {
              // 1. Sync location to backend
              await api.request('POST', '/location', coords);
            } catch (e) {
              console.warn("Location sync failed, but continuing with load...", e);
            }
            
            // 2. Load dashboard data
            await loadDataGrid();
          }, (geoErr) => {
            console.warn("Geolocation denied or failed:", geoErr);
            loadDataGrid();
          });
        } else {
          loadDataGrid();
        }
      } catch (err) {
        console.error('Dashboard setup error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    const loadDataGrid = async () => {
      try {
        const [meRes, statsRes, forecastRes] = await Promise.all([
          api.getMe(),
          api.getClaimStats(),
          api.getEarningsForecast().catch(() => ({ forecast: [] })),
        ]);

        setUser(meRes.user);
        setPolicy(meRes.policy);
        setClaimStats(statsRes);
        setWeeklyData(forecastRes.forecast || []);
      } catch (err) {
        console.error("Dashboard load failed:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    syncLocationAndLoad();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '24px', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} className="animate-spin" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '24px' }}>
        <AlertCircle size={48} color="var(--accent-red)" />
        <p style={{ color: 'var(--text-secondary)' }}>{error || 'Failed to load dashboard'}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const totalProtected = claimStats?.totalPaid || 0;
  const totalEarnings = (user.earningHistory || []).reduce((sum, e) => sum + e.amount, 0) || 0;
  const weeklyProtected = claimStats?.thisWeekProtected || 0;
  const weeklyEarnings = claimStats?.thisWeekEarnings || 0;
  const successRate = claimStats?.claimSuccessRate || 0;
  const recentClaims = claimStats?.recentClaims || [];
  const policyActive = policy || user.activePlan !== 'none';

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* ── DISRUPTION BANNERS (auto-trigger) ── */}
      {activeTriggers.map(trigger => (
        <DisruptionBanner
          key={trigger.triggerID}
          trigger={trigger}
          onClaim={(t) => setZeroTouchTrigger(t)}
          onDismiss={() => dismissTrigger(trigger.triggerID)}
        />
      ))}

      {/* ── ZERO-TOUCH CLAIM OVERLAY ── */}
      {zeroTouchTrigger && (
        <ZeroTouchOverlay
          trigger={zeroTouchTrigger}
          onComplete={(result) => {
            setZeroTouchTrigger(null);
            dismissTrigger(zeroTouchTrigger.triggerID);
          }}
        />
      )}

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '32px', margin: 0 }}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <div className="live-badge">🔴 LIVE {liveTicker}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <MapPin size={14} />
            <span>{user.zone || 'Zone'}, {user.city} — {user.platform || 'Platform'} Verified</span>
            <span style={{ margin: '0 8px', opacity: 0.2 }}>|</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: 600 }}>HEX: {h3Index.getHexForLocation(user.zone, user.city)}</span>
          </div>
          <div className="data-freshness-bar" id="data-freshness">
            📡 Data fresh as of {new Date().toLocaleTimeString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {policyActive ? (
            <Badge variant="green" style={{ fontSize: '14px', padding: '8px 16px' }}>
              🛡 {(user.plan || policy?.planType || 'Standard').toUpperCase()} ACTIVE
            </Badge>
          ) : (
            <Button variant="primary" onClick={() => navigate('/plans')}>Activate Plan</Button>
          )}
        </div>
      </header>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <Card glow className={isLive ? "value-updated" : ""}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>THIS WEEK PROTECTED</div>
          <div id="kpi-earnings-protected" style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: 'var(--accent-cyan)' }}>
            ₹{weeklyProtected.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent-green)' }}>
            <ArrowUpRight size={14} /> Auto-credited to UPI
          </div>
        </Card>

        <Card className={isLive ? "value-updated" : ""}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>TOTAL EARNINGS PROTECTED</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>₹{totalProtected.toLocaleString()}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {claimStats?.totalClaims || 0} claims paid
          </div>
        </Card>

        <Card className={isLive ? "value-updated" : ""}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>LIVE RISK LEVEL</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div id="kpi-risk-level" style={{ fontSize: '32px', fontWeight: 700, color: liveRisk >= 70 ? '#FF4D6A' : liveRisk >= 45 ? '#FF8C42' : '#00FF9C' }}>
              {liveRisk >= 70 ? 'HIGH' : liveRisk >= 45 ? 'MEDIUM' : 'LOW'}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Score: {liveRisk}</div>
              <Badge variant={liveRisk >= 70 ? 'red' : liveRisk >= 45 ? 'amber' : 'green'}>
                {liveRisk >= 70 ? 'CRITICAL' : liveRisk >= 45 ? 'WARNING' : 'SAFE'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>{liveWeather?.event || 'WEATHER'} STATUS</div>
          <div id="live-weather-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                {liveWeather?.event === 'Heavy Rain' ? '🌧' : liveWeather?.event === 'Heatwave' ? '🌡️' : '☀️'}
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>{liveWeather?.temperature || 32}°C</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{liveWeather?.description || 'Loading weather...'}</div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
             {liveWeather?.isLive ? '🔴 LIVE FEED ACTIVE' : '📡 Sourcing from IMD'}
          </div>
        </Card>
      </div>

      {/* Maps & Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px', marginBottom: '32px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px' }}>AI Revenue Forecast (7 Days)</h3>
            <Badge variant="cyan">Live Model</Badge>
          </div>
          {weeklyData.length > 0 ? (
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="expectedEarnings" stroke="var(--accent-cyan)" fill="url(#colorExpected)" strokeWidth={2} name="Expected" />
                  <Area type="monotone" dataKey="protectedFloor" stroke="var(--accent-green)" fill="none" strokeWidth={1} strokeDasharray="5 5" name="Protected Floor" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <p>Forecast loading...</p>
            </div>
          )}
        </Card>

        <Card glow style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px' }}>Live H3 Risk Grid</h3>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse 2s infinite' }} />
          </div>
          <H3RiskMap 
            city={user.city} 
            zone={user.zone} 
            isDisrupted={activeTriggers.some(t => t.triggerID === 'TRIGGER_RAIN' || t.triggerID === 'TRIGGER_FLOOD')} 
          />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
            📡 Real-time street-level spatial matching active
          </div>
        </Card>
      </div>

      {/* Recent Claims */}
      <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Recent Claims</h3>
          <Button variant="ghost" onClick={() => navigate('/claim')} style={{ color: 'var(--accent-cyan)' }}>View All History</Button>
        </div>
        {recentClaims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-muted)' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Shield size={40} style={{ opacity: 0.2 }} />
            </div>
            <p style={{ fontSize: '15px' }}>Your protection is active. No claims detected yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recentClaims.map((claim, idx) => (
              <div key={idx} className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: '1px solid var(--border)' }}>
                    {claim.event === 'Heavy Rain' || claim.event === 'Flood' ? '🌧' : claim.event === 'Storm' ? '⛈' : claim.event === 'Heatwave' ? '☀️' : '🌡'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>{claim.event}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{claim.displayDate} • {claim.zone}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: claim.status === 'paid' ? 'var(--accent-green)' : 'var(--accent-orange)', marginBottom: '4px' }}>
                    {claim.status === 'paid' ? `+₹${claim.approvedPayout}` : claim.status}
                  </div>
                  <Badge variant={claim.status === 'paid' ? 'green' : 'amber'} style={{ fontSize: '10px', padding: '2px 8px' }}>
                    {claim.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserDashboard;
