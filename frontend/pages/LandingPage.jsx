import React from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { PlayCircle, Brain, Zap, Shield, FileX, MapPin, CheckCircle, Smartphone, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <>
      <div style={{ width: '100%', overflowX: 'hidden' }}>
        {/* HERO SECTION */}
        <section style={{
          minHeight: '100vh',
          padding: '160px 5% 80px',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}>
          {/* Subtle particle background simulation */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 70% 30%, rgba(0, 224, 255, 0.08) 0%, transparent 40%)',
            zIndex: -1
          }}></div>

          <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', maxWidth: '1400px', margin: '0 auto', gap: '40px' }}>
            {/* Left Col */}
            <div style={{ flex: '1 1 60%', minWidth: '320px' }} className="animate-fade-in-up">
              
              <h1 style={{ fontSize: '72px', letterSpacing: '-2px', marginBottom: '24px', lineHeight: 1.1 }}>
                Protect Your<br/>
                Earnings with<br/>
                Intelligent <span className="text-cyan-gradient glow-text" style={{ textShadow: '0 0 20px rgba(0,224,255,0.4)' }}>AI</span>
              </h1>
              
              <p style={{ fontSize: '20px', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '40px', lineHeight: 1.6 }}>
                Automatic payouts when weather disruptions cut your income. Built specifically for Swiggy, Zomato & Dunzo delivery partners.
              </p>
              
              <div style={{ display: 'flex', gap: '24px', marginBottom: '48px', flexWrap: 'wrap' }}>
                <Link to="/login">
                  <Button variant="primary" glow style={{ padding: '16px 32px', fontSize: '18px' }}>
                    Get Protected Today
                  </Button>
                </Link>
                <Button variant="ghost" icon={<PlayCircle />}>
                  Watch 2-min Demo 
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '32px', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span><strong>12,000+</strong> Workers Protected</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
                <span><strong>₹2.4Cr</strong> Paid Out</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
                <span><strong>4.8★</strong> Rating</span>
              </div>
            </div>

            {/* Right Col */}
            <div style={{ flex: '1 1 35%', position: 'relative', minWidth: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ position: 'relative', zIndex: 5, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', overflow: 'visible' }}>
                  <img 
                    src="/swiggy-v2.png" 
                    alt="Swiggy Delivery Partner" 
                    style={{ 
                      width: '130%', 
                      maxWidth: '600px',
                      height: 'auto',
                      zIndex: 5,
                      /* Use mask to hide edges of the non-transparent background */
                      maskImage: 'radial-gradient(circle, black 50%, transparent 95%)',
                      WebkitMaskImage: 'radial-gradient(circle, black 50%, transparent 95%)',
                      opacity: 0.95
                    }} 
                  />
                </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" style={{ padding: '120px 5%', background: 'var(--bg-secondary)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '80px' }}>Why Trustpay Beats Every Alternative</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
              <Card hover>
                <Brain size={40} color="var(--accent-cyan)" style={{ filter: 'drop-shadow(0 0 10px rgba(0,224,255,0.5))', marginBottom: '24px' }} />
                <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>AI Risk Prediction</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Our model analyzes 47 weather + traffic signals 6 hours ahead to calculate risk and guarantee coverage.</p>
              </Card>
              <Card hover>
                <Zap size={40} color="var(--accent-cyan)" style={{ marginBottom: '24px' }} />
                <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Zero-Touch Claims</h3>
                <p style={{ color: 'var(--text-secondary)' }}>No forms. No calls. No arguments. Claims are auto-approved in under 60 seconds.</p>
              </Card>
              <Card hover>
                <Shield size={40} color="var(--accent-cyan)" style={{ marginBottom: '24px' }} />
                <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Weekly Micro-Plans</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Start from ₹20/week. No annual lock-in, no hidden fees, cancel anytime.</p>
              </Card>
              <Card hover>
                <FileX size={40} color="var(--accent-cyan)" style={{ marginBottom: '24px' }} />
                <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Fraud Detection</h3>
                <p style={{ color: 'var(--text-secondary)' }}>GPS + behavioral AI flags 99.2% of false claims automatically, keeping premiums low.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" style={{ padding: '120px 5%' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '48px', marginBottom: '80px' }}>Three Steps to Income Safety</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', flexWrap: 'wrap', gap: '40px' }}>
              {/* Dotted Line */}
              <div style={{ position: 'absolute', top: '40px', left: '10%', right: '10%', height: '2px', background: 'repeating-linear-gradient(90deg, var(--border) 0, var(--border) 10px, transparent 10px, transparent 20px)', zIndex: -1, '@media (maxWidth: 768px)': { display: 'none' } }}></div>
              
              {[
                { step: 1, title: 'Sign Up in 2 Minutes', icon: Smartphone, desc: 'Enter phone, city, select platform. Instant KYC via Aadhaar.' },
                { step: 2, title: 'Choose Your Plan', icon: Shield, desc: 'AI recommends the right coverage based on your zone & history.' },
                { step: 3, title: 'Get Paid Automatically', icon: Zap, desc: 'When disruption hits, payout lands in your UPI within minutes.' }
              ].map(item => (
                <div key={item.step} style={{ flex: '1 1 30%', background: 'var(--bg-primary)', padding: '0 20px' }}>
                  <div style={{ 
                    width: '80px', height: '80px', borderRadius: '40px', 
                    background: 'var(--bg-secondary)', border: '2px solid var(--accent-cyan)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px', position: 'relative'
                  }}>
                    <item.icon size={32} color="var(--accent-cyan)" />
                    <div style={{
                      position: 'absolute', top: -10, right: -10, width: 32, height: 32,
                      background: 'linear-gradient(135deg, var(--accent-cyan), #0077FF)',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', border: '3px solid var(--bg-primary)'
                    }}>{item.step}</div>
                  </div>
                  <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PLANS PREVIEW */}
        <section id="plans" style={{ padding: '120px 5%', background: 'var(--bg-secondary)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '80px' }}>Protection Starting ₹20/week</h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>
              
              <Card style={{ flex: '1 1 300px', maxWidth: '350px' }}>
                <h3 style={{ fontSize: '20px', color: 'var(--text-secondary)' }}>LITE</h3>
                <div style={{ fontSize: '48px', fontWeight: 700, margin: '16px 0' }}>₹20<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/wk</span></div>
                <div style={{ marginBottom: '32px' }}>Coverage up to: ₹800/wk</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                  <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle size={16} color="var(--accent-green)"/> Basic weather</li>
                  <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle size={16} color="var(--accent-green)"/> UPI Payout</li>
                </ul>
                <Button variant="outline" style={{ width: '100%' }}>Select Lite</Button>
              </Card>

              <Card glow style={{ flex: '1 1 300px', maxWidth: '380px', transform: 'scale(1.05)', position: 'relative', border: '1px solid var(--accent-cyan)' }}>
                <Badge variant="cyan" style={{ position: 'absolute', top: '-12px', right: '16px' }}>MOST POPULAR</Badge>
                <h3 style={{ fontSize: '20px', color: 'var(--accent-cyan)' }}>STANDARD</h3>
                <div style={{ fontSize: '56px', fontWeight: 700, margin: '16px 0' }}>₹35<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/wk</span></div>
                <div style={{ marginBottom: '32px' }}>Coverage up to: ₹1,500/wk</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                  <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle size={16} color="var(--accent-green)"/> All Weather + Heatwave</li>
                  <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle size={16} color="var(--accent-green)"/> AI Risk Alerts</li>
                  <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle size={16} color="var(--accent-green)"/> 45-min Processing</li>
                  <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle size={16} color="var(--accent-green)"/> Zone Recommendations</li>
                </ul>
                <Link to="/login" style={{ display: 'block' }}>
                  <Button variant="primary" glow style={{ width: '100%' }}>Activate Standard</Button>
                </Link>
              </Card>

              <Card style={{ flex: '1 1 300px', maxWidth: '350px' }}>
                <h3 style={{ fontSize: '20px', color: 'var(--accent-gold)' }}>PRO</h3>
                <div style={{ fontSize: '48px', fontWeight: 700, margin: '16px 0' }}>₹50<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/wk</span></div>
                <div style={{ marginBottom: '32px' }}>Coverage up to: ₹3,000/wk</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                  <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle size={16} color="var(--accent-green)"/> All Events Included</li>
                  <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle size={16} color="var(--accent-green)"/> Unlimited Claims</li>
                  <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle size={16} color="var(--accent-green)"/> 15-min Processing</li>
                </ul>
                <Button variant="outline" style={{ width: '100%' }}>Select Pro</Button>
              </Card>

            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: '80px 5% 40px', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '60px' }}>
            <div style={{ flex: '2 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <img src="/favicon.svg" alt="Trustpay Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '24px', color: 'var(--text-primary)' }}>Trustpay<span style={{ color: 'var(--accent-cyan)' }}>.</span></span>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>AI-powered income safety net for<br/>India's gig economy.</p>
            </div>
            
            <div style={{ flex: '1 1 150px' }}>
              <h4 style={{ marginBottom: '24px', color: 'white' }}>Product</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-secondary)' }}>
                {['Features', 'Plans', 'How it Works', 'API'].map(link => <li key={link} style={{ marginBottom: '12px' }}><a href="#" className="hover-cyan">{link}</a></li>)}
              </ul>
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <h4 style={{ marginBottom: '24px', color: 'white' }}>Company</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-secondary)' }}>
                {['About', 'Blog', 'Careers', 'Press'].map(link => <li key={link} style={{ marginBottom: '12px' }}><a href="#" className="hover-cyan">{link}</a></li>)}
              </ul>
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <h4 style={{ marginBottom: '24px', color: 'white' }}>Support</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-secondary)' }}>
                {['Help Center', 'Claims', 'Contact', 'Terms'].map(link => <li key={link} style={{ marginBottom: '12px' }}><a href="#" className="hover-cyan">{link}</a></li>)}
              </ul>
            </div>
          </div>
          
          <div style={{ maxWidth: '1200px', margin: '60px auto 0', paddingTop: '24px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            © {new Date().getFullYear()} Trustpay Technologies Pvt Ltd | RBI Registered | IRDAI Licensed
          </div>
        </footer>
      </div>
      <style>{`
        .hover-cyan:hover { color: var(--accent-cyan); text-decoration: none; }
      `}</style>
    </>
  );
};

export default LandingPage;
