import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Shield, TrendingUp, AlertTriangle, Activity, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import api from '../services/api.js';

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState(null);
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [verifyingId, setVerifyingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [metricsRes, pendingRes] = await Promise.all([
          api.getAdminMetrics(),
          api.getAdminPending()
        ]);
        setAdminData(metricsRes.adminData);
        setAdminAnalytics(metricsRes.adminAnalytics);
        setPendingVerifications(pendingRes || []);
      } catch (err) {
        console.error('Admin data error:', err);
        setError(err.message);
        // Fallback states...
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleVerify = async (userId, approve) => {
    setVerifyingId(userId);
    try {
      await api.verifyUser(userId, approve);
      setPendingVerifications(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert('Verification failed: ' + err.message);
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '24px', color: 'var(--text-secondary)' }}>
        <Loader2 size={48} className="animate-spin" style={{ opacity: 0.5 }} />
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  if (!adminData) return null;

  const kpiCards = [
    { label: 'Total Users', value: adminData.totalUsers?.toLocaleString() || '0', sub: adminData.totalUsersGrowth || '+0%', icon: Users, color: 'var(--accent-cyan)' },
    { label: 'Active Policies', value: adminData.activePolicies?.toLocaleString() || '0', sub: adminData.activePoliciesPercent || '0% activation', icon: Shield, color: 'var(--accent-green)' },
    { label: 'Claims This Month', value: adminData.claimsThisMonth?.toLocaleString() || '0', sub: `Avg ₹${adminData.avgPayout || 0}`, icon: Activity, color: 'var(--accent-orange)' },
    { label: 'Fraud Prevented', value: `₹${(adminData.fraudPreventedValue || 0).toLocaleString()}`, sub: `${adminData.fraudPreventedCases || 0} cases flagged`, icon: AlertTriangle, color: 'var(--accent-red)' },
    { label: 'Platform Revenue', value: `₹${(adminData.platformRevenue || 0).toLocaleString()}`, sub: 'Premiums collected', icon: TrendingUp, color: 'var(--accent-gold)' },
    { label: 'Zones Flagged', value: adminData.zonesFlagged || '0', sub: 'Active risk monitors', icon: AlertTriangle, color: 'var(--accent-purple)' },
  ];

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '80px' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Admin Command Centre</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time platform metrics • Updated live
          </p>
        </div>
        {error && (
          <Badge variant="amber" style={{ fontSize: '12px' }}>API in dev mode — partial data</Badge>
        )}
      </header>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {kpiCards.map((kpi, i) => (
          <Card key={i} glow={i === 0}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{kpi.label}</div>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${kpi.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon size={18} color={kpi.color} />
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{kpi.sub}</div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '32px' }}>
        {/* Claims Trend */}
        <Card>
          <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Claims Trend (Weekly)</h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={adminAnalytics.claimsTrend || []}>
                <defs>
                  <linearGradient id="colorFiled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="filed" stroke="var(--accent-cyan)" fill="url(#colorFiled)" strokeWidth={2} name="Filed" />
                <Area type="monotone" dataKey="approved" stroke="var(--accent-green)" fill="none" strokeWidth={2} strokeDasharray="4 4" name="Approved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Fraud Breakdown Pie */}
        <Card>
          <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Fraud by Type</h3>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={adminAnalytics.fraudStatsByType || []} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {(adminAnalytics.fraudStatsByType || []).map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(adminAnalytics.fraudStatsByType || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                </div>
                <span style={{ fontWeight: 600 }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pending Verifications */}
      <Card style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Pending Partner Verifications</h3>
        {pendingVerifications.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No pending verifications</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingVerifications.map((user) => (
              <div key={user.id} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.platform} • {user.workerID}</div>
                </div>
                <div style={{ position: 'relative' }}>
                   <a href={user.platformProofUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '13px', textDecoration: 'none' }}>
                     <img src={user.platformProofUrl} alt="Proof" style={{ width: 60, height: 40, borderRadius: 4, objectFit: 'cover' }} />
                     <span>View Full Proof <ExternalLink size={14} /></span>
                   </a>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => handleVerify(user.id, false)}
                    disabled={verifyingId === user.id}
                    style={{ background: '#FF4D6A22', color: '#FF4D6A', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                  <button 
                    onClick={() => handleVerify(user.id, true)}
                    disabled={verifyingId === user.id}
                    style={{ background: '#00FF9C22', color: '#00FF9C', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      {adminAnalytics.recentActivity?.length > 0 && (
        <Card>
          <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Recent Payouts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {adminAnalytics.recentActivity.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{a.user} — {a.city}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.time}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-green)' }}>₹{a.amount}</div>
                  <Badge variant="green" style={{ fontSize: '10px' }}>{a.status?.toUpperCase()}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
