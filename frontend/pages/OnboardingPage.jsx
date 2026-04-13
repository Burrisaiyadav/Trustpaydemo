import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, User, Shield, ShieldCheck, Activity, AlertCircle, ArrowUpRight, Camera } from 'lucide-react';
import PlatformVerification from './onboarding/PlatformVerification';
import VerificationPending from './onboarding/VerificationPending';
import PAN_VERIFICATION from '../utils/panVerification';
import './Onboarding.css';

export default function OnboardingPage() {
  const { user, logout, completeOnboarding } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1, 2, 3.1, 3.2, 3.4, 3.5, 3.6, 3.7 (REVIEW)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    platforms: [], 
    panNumber: '',
    panName: '', 
    phone: '',
    payoutMethod: '', // 'bank' or 'upi'
    bankDetails: { account: '', ifsc: '' },
    upiId: '',
    isUpiVerified: false
  });

  const steps = [
    { id: 1, label: 'Basic details', icon: <User size={18} /> },
    { id: 2, label: 'Work details', icon: <Shield size={18} /> },
    { id: 3, label: 'KYC details', icon: <ShieldCheck size={18} /> }
  ];

  const currentMainStep = Math.floor(step);

  const handleContinue = () => {
    if (step === 1) {
      if (!formData.fullName.trim()) {
        alert('Please enter your full name to continue.');
        return;
      }
      setStep(2);
    }
    else if (step === 2) {
      if (formData.platforms.length === 0) {
        alert('Please select at least one work platform.');
        return;
      }
      setStep(2.5);
    }
    else if (step === 2.5) {
      if (user?.verificationStatus === 'UNDER_REVIEW') {
          // Stay here or show pending
      } else if (user?.verificationStatus === 'APPROVED') {
          setStep(3.1);
      } else {
          // If not submitted yet, the child component handles submission
      }
    }
    else if (step === 3.1) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
        alert('Please enter a valid PAN number (e.g. ABCDE1234F)');
        return;
      }
      setFormData(prev => ({ ...prev, panName: prev.fullName.toUpperCase() }));
      setStep(3.2);
    }
    else if (step === 3.2) setStep(3.4);
    else if (step === 3.4) {
      if (!formData.phone || formData.phone.length < 10) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
      }
      setStep(3.5);
    }
    else if (step === 3.5) {
      if (!formData.payoutMethod) {
        alert('Please select a payout method.');
        return;
      }
      setStep(3.6);
    }
    else if (step === 3.6) {
      if (formData.payoutMethod === 'bank') {
        if (!formData.bankDetails.account || !formData.bankDetails.ifsc) {
          alert('Please enter your account number and IFSC code.');
          return;
        }
      } else if (formData.payoutMethod === 'upi') {
        if (!formData.upiId) {
          alert('Please enter your UPI ID.');
          return;
        }
        if (!formData.isUpiVerified) {
          alert('Please verify your UPI ID before continuing.');
          return;
        }
      }
      setStep(3.7);
    }
    else if (step === 3.7) {
      setIsSubmitting(true);
      setTimeout(() => {
        // Persist onboarding data to localStorage so dashboard can read it
        const savedUser = JSON.parse(localStorage.getItem('tp_user') || '{}');
        const updatedUser = {
          ...savedUser,
          name: formData.fullName,
          platform: formData.platforms[0] || savedUser.platform || 'Swiggy',
          platforms: formData.platforms,
          panNumber: formData.panNumber,
          phone: formData.phone,
          payoutMethod: formData.payoutMethod,
          upiID: formData.payoutMethod === 'upi' ? formData.upiId : savedUser.upiID,
          bankDetails: formData.payoutMethod === 'bank' ? formData.bankDetails : savedUser.bankDetails,
          isOnboardingComplete: true,
          plan: savedUser.plan || 'standard',
          city: savedUser.city || 'Hyderabad',
          zone: savedUser.zone || 'Kondapur',
          vehicleType: savedUser.vehicleType || '2-Wheeler',
          protectionScore: savedUser.protectionScore || 76,
        };
        localStorage.setItem('tp_user', JSON.stringify(updatedUser));
        completeOnboarding();
        navigate('/dashboard');
      }, 2500);
    }
  };

  const handleBackStep = () => {
    if (step === 2) setStep(1);
    else if (step === 3.1) setStep(2);
    else if (step === 3.2) setStep(3.1);
    else if (step === 3.4) setStep(3.2);
    else if (step === 3.5) setStep(3.4);
    else if (step === 3.6) setStep(3.5);
    else if (step === 3.7) setStep(3.6);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="onboarding-container">
      {/* ── SIDEBAR ── */}
      <aside className="onboarding-sidebar">
        <div className="sidebar-top">
          <div className="user-profile-card">
            <div className="avatar-circle">
              {formData.fullName.charAt(0) || 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{formData.fullName || 'User'}</span>
              <button className="logout-inline-btn" onClick={handleLogout}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>

          <div className="onboarding-heading">
            Onboarding: <br />
            <strong style={{ color: '#2563EB' }}>Trustpay</strong>
          </div>

          <nav className="onboarding-steps">
            <div className="steps-line"></div>
            {steps.map((s) => (
              <div 
                key={s.id} 
                className={`step-item ${currentMainStep === s.id ? 'active' : currentMainStep > s.id ? 'completed' : ''}`}
                style={{ cursor: currentMainStep > s.id ? 'pointer' : 'default' }}
                onClick={() => currentMainStep > s.id && setStep(s.id)}
              >
                <div className="step-number-box">
                  {currentMainStep > s.id ? <ShieldCheck size={16} /> : s.id}
                </div>
                <span className="step-label">{s.label}</span>
              </div>
            ))}
          </nav>
        </div>

      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="onboarding-main">
        <div className="onboarding-card">
          <div className="card-breadcrumb">
             <div className="razorpay-logo-ref">
               <img src="/favicon.svg" alt="Trustpay" style={{ width: '16px', height: '16px' }} />
               <span style={{ color: '#2563EB', fontWeight: 800 }}>Trustpay</span>
             </div>
          </div>

          <div className="card-content">
            {step === 1 && (
              <div className="onboarding-step-content fade-in">
                <h1 className="onboarding-step-title">Add your Name</h1>
                <p className="onboarding-step-desc">
                  Let us know the name of the person who'll be completing the onboarding
                </p>
                <div className="onboarding-input-group">
                  <label>Full name</label>
                  <input 
                    type="text" 
                    className="onboarding-input"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="e.g. Burri Vishnu Sai"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="onboarding-step-content fade-in" style={{ maxWidth: '600px' }}>
                <h1 className="onboarding-step-title">Where do you work?</h1>
                <p className="onboarding-step-desc">
                  Select the platform you currently deliver or work for
                </p>
                <div className="platform-grid">
                  {[
                    { name: 'Swiggy', logo: '/platforms/swiggy.png' },
                    { name: 'Zomato', logo: '/platforms/zomato.png' },
                    { name: 'Zepto', logo: '/platforms/zepto.png' },
                    { name: 'Blinkit', logo: '/platforms/blinkit.png' },
                    { name: 'Dunzo', logo: '/platforms/dunzo.png' },
                    { name: 'Others', logo: '/platforms/others.png' }
                  ].map(platform => (
                    <div 
                      key={platform.name} 
                      className={`platform-card ${formData.platforms.includes(platform.name) ? 'selected' : ''}`}
                      onClick={() => {
                        const newPlatforms = formData.platforms.includes(platform.name)
                          ? formData.platforms.filter(p => p !== platform.name)
                          : [...formData.platforms, platform.name];
                        setFormData({...formData, platforms: newPlatforms});
                      }}
                    >
                      <div className="platform-logo-container">
                        <img src={platform.logo} alt={platform.name} className="platform-logo-img" />
                      </div>
                      <span className="platform-name">{platform.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step === 2.5 && (
              <div className="onboarding-step-content fade-in">
                {user?.verificationStatus === 'UNDER_REVIEW' ? (
                  <VerificationPending />
                ) : (
                  <PlatformVerification 
                    onComplete={() => {
                      // Backend will update status to UNDER_REVIEW
                      window.location.reload(); 
                    }} 
                  />
                )}
              </div>
            )}

            {step === 3.1 && (
              <div className="onboarding-step-content fade-in">
                <div className="pan-step">
                  <div className="pan-header">
                    <div className="pan-icon">🪪</div>
                    <h2>PAN Card Verification</h2>
                    <p>Required for income protection claims above ₹50,000/year</p>
                  </div>

                  <div className="onboarding-input-group">
                    <label className="form-label">
                      PAN Number
                      <span className="label-hint" style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>Permanent Account Number</span>
                    </label>

                    <div className={`pan-input-wrapper ${formData.panFormatValid ? 'valid' : formData.panNumber.length === 10 ? 'invalid' : ''}`} id="pan-input-wrapper">
                      <span className="pan-prefix-icon">🪪</span>
                      <input
                        type="text"
                        id="pan-input"
                        className="pan-input"
                        placeholder="ABCDE1234F"
                        maxlength="10"
                        autocomplete="off"
                        spellcheck="false"
                        value={formData.panNumber}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                          const result = PAN_VERIFICATION.validateFormat(val);
                          setFormData({
                            ...formData, 
                            panNumber: val, 
                            panFormatValid: result.valid,
                            panFormatError: result.error,
                            panHint: result.hint
                          });
                        }}
                        style={{ textTransform:'uppercase', letterSpacing:'2px', fontFamily:'var(--font-mono)' }}
                      />
                      <span className={`pan-status-dot ${formData.panFormatValid ? 'valid' : formData.panNumber.length === 10 ? 'invalid' : ''}`}></span>
                    </div>

                    <div className="pan-format-guide">
                      <div className="pan-format-row">
                        <span className={`fmt-box letters ${formData.panNumber.length >= 5 && /^[A-Z]{5}/.test(formData.panNumber) ? 'valid' : formData.panNumber.length >= 5 ? 'invalid' : ''}`} title="5 Letters">ABCDE</span>
                        <span className={`fmt-box numbers ${formData.panNumber.length >= 9 && /^[A-Z]{5}[0-9]{4}/.test(formData.panNumber) ? 'valid' : formData.panNumber.length >= 9 ? 'invalid' : ''}`} title="4 Numbers">1234</span>
                        <span className={`fmt-box letter ${formData.panNumber.length === 10 && /[A-Z]$/.test(formData.panNumber) ? 'valid' : formData.panNumber.length === 10 ? 'invalid' : ''}`} title="1 Letter">F</span>
                      </div>
                      <div className="pan-format-labels" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                        <span>5 letters</span>
                        <span>4 numbers</span>
                        <span>1 letter</span>
                      </div>
                    </div>

                    {formData.panNumber && (
                      <div className="pan-feedback" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginTop: '12px' }}>
                        <span className="feedback-icon">{formData.panFormatValid ? '✅' : '❌'}</span>
                        <span className={`feedback-text ${formData.panFormatValid ? 'success' : 'error'}`}>
                          {formData.panFormatValid ? formData.panHint : formData.panFormatError}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="onboarding-input-group" style={{ marginTop: '24px' }}>
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="onboarding-input"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      max={new Date().toISOString().split("T")[0]}
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Must match your PAN records</p>
                  </div>

                  {!formData.panVerified && !formData.panLoading && (
                    <button
                      className="btn-primary"
                      style={{ width: '100%', marginTop: '24px', opacity: formData.panFormatValid ? 1 : 0.5, cursor: formData.panFormatValid ? 'pointer' : 'not-allowed' }}
                      disabled={!formData.panFormatValid}
                      onClick={async () => {
                        setFormData(prev => ({ ...prev, panLoading: true }));
                        const result = await PAN_VERIFICATION.verifyWithAPI(formData.panNumber, formData.fullName);
                        setFormData(prev => ({ 
                          ...prev, 
                          panLoading: false, 
                          panVerified: result.verified, 
                          panResult: result,
                          panError: result.error
                        }));
                        if (result.verified) {
                          setStep(3.2); // Move to review step
                        }
                      }}
                    >
                      🔍 Verify PAN in Real-Time
                    </button>
                  )}

                  {formData.panLoading && (
                    <div className="pan-loading" style={{ marginTop: '24px' }}>
                      <div className="pan-load-step">
                        <div className="pls-dot active"></div>
                        <span>Connecting to Income Tax database...</span>
                      </div>
                      <div className="pan-load-step" style={{ opacity: 0.5 }}>
                        <div className="pls-dot"></div>
                        <span>Validating details...</span>
                      </div>
                    </div>
                  )}

                  {formData.panError && (
                    <div className="pan-error-card" style={{ marginTop: '24px' }}>
                      <span className="pan-error-icon">❌</span>
                      <div className="pan-error-title">Verification Failed</div>
                      <div className="pan-error-msg">{formData.panError}</div>
                      <button className="btn-ghost" style={{ width: '100%', marginTop: '12px' }} onClick={() => setFormData({ ...formData, panError: null })}>
                        Try Again
                      </button>
                    </div>
                  )}

                  <div className="pan-security" style={{ marginTop: '32px' }}>
                    <span>🔒</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Verified via Sandbox.co.in KYC API + NSDL. Your PAN is encrypted and never stored in plain text.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {step === 3.2 && formData.panResult && (
              <div className="onboarding-step-content fade-in">
                <h1 className="onboarding-step-title">Review your PAN details</h1>
                <div className="pan-success-card">
                  <div className="pan-success-header">
                    <span className="pan-tick">✅</span>
                    <div>
                      <div className="pan-success-title">PAN Verified Successfully</div>
                      <div className="pan-success-source">{formData.panResult.source}</div>
                    </div>
                  </div>

                  <div className="pan-details-grid">
                    <div className="pan-detail-row">
                      <span className="pd-label">PAN Number</span>
                      <span className="pd-value mono">{formData.panResult.pan}</span>
                    </div>
                    <div className="pan-detail-row">
                      <span className="pd-label">Name on PAN</span>
                      <span className="pd-value">{formData.panResult.name}</span>
                    </div>
                    <div className="pan-detail-row">
                      <span className="pd-label">Name Match</span>
                      <span className={`pd-value ${formData.panResult.nameMatch >= 70 ? "success" : "warning"}`}>
                        {formData.panResult.nameMatchText}
                      </span>
                    </div>
                    <div className="pan-detail-row">
                      <span className="pd-label">PAN Type</span>
                      <span className="pd-value">{formData.panResult.panType}</span>
                    </div>
                    <div className="pan-detail-row">
                      <span className="pd-label">PAN Status</span>
                      <span className="pd-value success" style={{ color: '#00FF9C' }}>{formData.panResult.status}</span>
                    </div>
                  </div>
                </div>
                <p style={{ marginTop: '24px', fontSize: '13px', color: '#64748B' }}>
                  Your identity is now verified. Access to protection is active.
                </p>
              </div>
            )}

            {step === 3.7 && (
              <div className="onboarding-step-content fade-in" style={{ maxWidth: '600px' }}>
                <h1 className="onboarding-step-title">Review your details</h1>
                <p className="onboarding-step-desc">
                  Final verification of your account information
                </p>
                <div className="review-summary">
                  <div className="review-item">
                    <div className="review-label">Name</div>
                    <div className="review-value-box">
                      <span>{formData.fullName}</span>
                      <button className="edit-btn" onClick={() => setStep(1)}><Activity size={14} /></button>
                    </div>
                  </div>
                  <div className="review-item">
                    <div className="review-label">Work Platforms</div>
                    <div className="review-value-box">
                      <span>{formData.platforms.join(', ')}</span>
                      <button className="edit-btn" onClick={() => setStep(2)}><Activity size={14} /></button>
                    </div>
                  </div>
                  <div className="review-item">
                    <div className="review-label">PAN</div>
                    <div className="review-value-box">
                      <span>{formData.panNumber}</span>
                      <button className="edit-btn" onClick={() => setStep(3.1)}><Activity size={14} /></button>
                    </div>
                  </div>
                  <div className="review-item">
                    <div className="review-label">Payout Method</div>
                    <div className="review-value-box">
                      <span>
                        {formData.payoutMethod === 'upi'
                          ? `UPI: ${formData.upiId || 'Not entered'}`
                          : formData.payoutMethod === 'bank'
                            ? `Bank: ****${(formData.bankDetails.account || '').slice(-4) || 'XXXX'}`
                            : 'Not selected'}
                      </span>
                      <button className="edit-btn" onClick={() => setStep(3.5)}><Activity size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3.4 && (
              <div className="onboarding-step-content fade-in">
                <h1 className="onboarding-step-title">Auto-fill KYC details</h1>
                <p className="onboarding-step-desc">
                  Enter mobile linked with your PAN
                </p>
                <div className="onboarding-input-group">
                  <label>Linked Mobile Number</label>
                  <div className="phone-input-wrapper">
                    <span className="prefix">+91</span>
                    <input 
                      type="text" 
                      className="onboarding-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="9876543210"
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3.5 && (
              <div className="onboarding-step-content fade-in" style={{ maxWidth: '600px' }}>
                <h1 className="onboarding-step-title">How would you like to receive payouts?</h1>
                <p className="onboarding-step-desc">
                  Choose your preferred withdrawal method
                </p>
                <div className="payout-selection">
                  <div 
                    className={`payout-card ${formData.payoutMethod === 'bank' ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, payoutMethod: 'bank'})}
                  >
                    <div className="payout-icon">🏦</div>
                    <div className="payout-info">
                      <span className="payout-title">Bank Account</span>
                      <span className="payout-subtitle">Direct transfer to your account</span>
                    </div>
                  </div>
                  <div 
                    className={`payout-card ${formData.payoutMethod === 'upi' ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, payoutMethod: 'upi'})}
                  >
                    <div className="payout-icon">📱</div>
                    <div className="payout-info">
                      <span className="payout-title">UPI ID</span>
                      <span className="payout-subtitle">Instant settlement via VPA</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3.6 && (
              <div className="onboarding-step-content fade-in">
                {formData.payoutMethod === 'bank' ? (
                  <>
                    <h1 className="onboarding-step-title">Enter Bank Details</h1>
                    <div className="onboarding-input-group">
                      <label>ACCOUNT NUMBER</label>
                      <input 
                        type="password" 
                        className="onboarding-input"
                        placeholder="000000000000"
                        onChange={(e) => setFormData({...formData, bankDetails: {...formData.bankDetails, account: e.target.value}})}
                      />
                    </div>
                    <div className="onboarding-input-group">
                      <label>IFSC CODE</label>
                      <input 
                        type="text" 
                        className="onboarding-input"
                        placeholder="HDFC0001234"
                        onChange={(e) => setFormData({...formData, bankDetails: {...formData.bankDetails, ifsc: e.target.value.toUpperCase()}})}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="onboarding-step-title">Enter UPI ID</h1>
                    <div className="onboarding-input-group">
                      <label>UPI ID</label>
                      <div className="upi-input-wrapper">
                        <input 
                          type="text" 
                          className="onboarding-input"
                          placeholder="name@upi"
                          value={formData.upiId}
                          onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                        />
                        <button className="verify-btn" onClick={() => setFormData({...formData, isUpiVerified: true})}>
                          {formData.isUpiVerified ? "VERIFIED ✅" : "VERIFY"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}


          </div>

          <div className="onboarding-footer">
            {step > 1 && step < 4 && (
              <button className="onboarding-back-btn" onClick={handleBackStep}>
                BACK
              </button>
            )}
            <button 
              className="onboarding-continue-btn" 
              onClick={handleContinue}
              style={{ width: step === 3.7 ? '100%' : 'auto', maxWidth: step === 3.7 ? 'none' : '180px' }}
            >
              {step === 3.7 ? "GO TO DASHBOARD" : "CONTINUE"}
            </button>
          </div>
        </div>
      </main>

      {isSubmitting && (
        <div className="onboarding-loading-overlay">
          <div className="loading-content">
            <div className="spinner-wrapper">
              <div className="loading-spinner-ring"></div>
              <img src="/favicon.svg" alt="Loading" className="loading-favicon-spinning" />
            </div>
            <p>Setting up your dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}
