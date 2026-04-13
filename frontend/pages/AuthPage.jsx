import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore, findUser, updatePassword } from "../store/authStore";
import { ShieldCheck, Eye, EyeOff, AlertCircle, Shield } from "lucide-react";
import api from "../services/api.js";
import "./Auth.css";

export default function AuthPage() {
  const { isLoggedIn, user, hasPlan, login } = useAuthStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: ID, 2: Pass, 10: ForgotID, 11: ForgotOTP, 12: ForgotNewPass
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    newPassword: ""
  });

  // Password Requirements
  const requirements = [
    { id: 'lowercase', text: 'Must include at least 1 lowercase letter', regex: /[a-z]/ },
    { id: 'uppercase', text: 'Must include at least 1 uppercase letter', regex: /[A-Z]/ },
    { id: 'number', text: 'Must include at least 1 number', regex: /[0-9]/ },
    { id: 'special', text: 'Must include at least 1 special character', regex: /[@$!%*?&]/ },
    { id: 'length', text: 'Must be at least 8 characters long', min: 8 },
  ];

  const validateReq = (req, val) => {
    if (req.min) return val.length >= req.min;
    return req.regex.test(val);
  };

  const isNewPassValid = requirements.every(r => validateReq(r, formData.newPassword));

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      if (!user?.isOnboardingComplete) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate(hasPlan() ? "/dashboard" : "/plans", { replace: true });
      }
    }
  }, [isLoggedIn, navigate, hasPlan, user]);

  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    if (step === 1) {
      // Login Step 1: Check User
      setTimeout(() => {
        const user = findUser(formData.identifier);
        if (user) {
          setStep(2);
        } else {
          setError("No account found with this identifier. Please register first.");
        }
        setLoading(false);
      }, 800);
    } 
    else if (step === 2) {
      // Login Step 2: Check Password
      try {
        const data = await api.login({
          identifier: formData.identifier,
          email: formData.identifier, // sending both just in case backend expects email
          password: formData.password
        });

        if (data) {
          login({ 
            id: data.id || data.user?.id || "user_1", 
            name: data.name || data.user?.name || "User", 
            email: formData.identifier,
            activePlan: data.activePlan || data.user?.activePlan || "none",
            isOnboardingComplete: data.isOnboardingComplete || data.user?.isOnboardingComplete || false
          }, data.token || "real_token");
        }
      } catch (err) {
        console.error("Login API error:", err);
        setError("Network error. Could not connect to API.");
      } finally {
        setLoading(false);
      }
    }
    else if (step === 10) {
      // Forgot Step 1: Check ID
      setTimeout(() => {
        const user = findUser(formData.identifier);
        if (user) {
          setStep(11);
        } else {
          setError("Identifier not found.");
        }
        setLoading(false);
      }, 800);
    }
    else if (step === 11) {
      // Forgot Step 2: Verify OTP
      const enteredOtp = otp.join("");
      setTimeout(() => {
        if (enteredOtp === "1234") {
          setStep(12);
        } else {
          setError("Invalid OTP! Use 1234");
        }
        setLoading(false);
      }, 800);
    }
    else if (step === 12) {
      // Forgot Step 3: Reset
      setTimeout(() => {
        if (updatePassword(formData.identifier, formData.newPassword)) {
          setStep(2);
          alert("Password updated successfully!");
        }
        setLoading(false);
      }, 1000);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 3) otpRefs[index + 1].current.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs[index - 1].current.focus();
  };

  const resetFlow = () => {
    setStep(1);
    setError("");
    setFormData({ identifier: "", password: "", newPassword: "" });
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand-top">
             <img src="/favicon.svg" alt="Trustpay Logo" className="brand-logo-img" />
             <span className="brand-name-white">Trustpay<span className="cyan-dot">.</span></span>
          </div>

          <div className="login-bottom-content">
            <h1 className="login-main-heading">
              Powering Instant Insurance Payouts for the Gig Economy
            </h1>
            
            <div className="login-check-items">
              <div className="check-item">
                <ShieldCheck size={18} />
                <span>Instant Claim Settlements</span>
              </div>
              <div className="check-item">
                <ShieldCheck size={18} />
                <span>Secure & Transparent System</span>
              </div>
              <div className="check-item">
                <ShieldCheck size={18} />
                <span>Real-Time Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="auth-card">
          <div className="auth-card-top">
            <div className="auth-logo-box">
              <img src="/favicon.svg" alt="Trustpay Logo" />
            </div>
            <p className="auth-welcome-text">
              {step >= 10 ? "Reset Password" : "Welcome back to Trustpay"}
            </p>
          </div>
          
          <div className="auth-card-body">
            {step === 1 && (
              <>
                <h2 className="auth-main-title">Login with your identifier</h2>
                <form onSubmit={handleAuth}>
                  <div className="input-group">
                    <input 
                      type="text" className="auth-input" placeholder="Email or Phone Number"
                      value={formData.identifier}
                      onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                      required
                    />
                  </div>
                  {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
                  <button type="submit" className="auth-primary-btn" disabled={loading || !formData.identifier}>
                    {loading ? "Checking..." : "Continue"}
                  </button>
                </form>
                <p className="auth-legal" style={{ marginTop: '24px' }}>
                  New to Trustpay? <Link to="/register" style={{ color: '#2563EB', fontWeight: 600 }}>Register Now</Link>
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <div className="auth-edit-hint">
                  <span className="current-id">{formData.identifier}</span>
                  <button onClick={resetFlow} className="edit-btn">Change</button>
                </div>
                <h2 className="auth-main-title">Enter your password</h2>
                <form onSubmit={handleAuth}>
                  <div className="input-group">
                    <div className="auth-input-wrapper">
                      <input 
                        type={showPassword ? "text" : "password"} className="auth-input" placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required autoFocus
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        <span style={{ fontSize: '12px' }}>{showPassword ? "HIDE" : "SHOW"}</span>
                      </button>
                    </div>
                  </div>
                  {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
                  <div className="auth-forgot">
                    <button type="button" onClick={() => setStep(10)} className="edit-btn">Forgot Password?</button>
                  </div>
                  <button type="submit" className="auth-primary-btn" disabled={loading || !formData.password}>
                    {loading ? "Verifying..." : "Login"}
                  </button>
                </form>
              </>
            )}

            {step === 10 && (
              <>
                <h2 className="auth-main-title">Reset your password</h2>
                <form onSubmit={handleAuth}>
                  <div className="input-group">
                    <input 
                      type="text" className="auth-input" placeholder="Email or Phone Number"
                      value={formData.identifier}
                      onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                      required
                    />
                  </div>
                  {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
                  <button type="submit" className="auth-primary-btn" disabled={loading || !formData.identifier}>
                    {loading ? "Sending OTP..." : "Get OTP"}
                  </button>
                  <button type="button" onClick={resetFlow} className="edit-btn" style={{ marginTop: '16px', width: '100%' }}>Back to Login</button>
                </form>
              </>
            )}

            {step === 11 && (
              <>
                <h2 className="auth-main-title">Verify OTP</h2>
                <div className="auth-edit-hint">
                  <span className="current-id">{formData.identifier}</span>
                </div>
                <div className="otp-input-container">
                  {otp.map((digit, i) => (
                    <input key={i} ref={otpRefs[i]} type="text" className="otp-box" value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      maxLength={1} autoFocus={i === 0}
                    />
                  ))}
                </div>
                {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}
                <button onClick={handleAuth} className="auth-primary-btn" disabled={loading || otp.some(d => !d)}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </>
            )}

            {step === 12 && (
              <>
                <h2 className="auth-main-title">Create new password</h2>
                <form onSubmit={handleAuth}>
                  <div className="input-group">
                    <div className="auth-input-wrapper">
                      <input 
                        type={showPassword ? "text" : "password"} className="auth-input" placeholder="New Password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                        required autoFocus
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div className="password-requirements">
                      {requirements.map((req) => {
                        const isValid = validateReq(req, formData.newPassword);
                        return (
                          <div key={req.id} className={`requirement-item ${isValid ? 'valid' : 'invalid'}`}>
                            {isValid ? <ShieldCheck size={14} /> : <div className="circle-placeholder" />}
                            <span>{req.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button type="submit" className="auth-primary-btn" disabled={loading || !isNewPassValid}>
                    {loading ? "Resetting..." : "Reset & Login"}
                  </button>
                </form>
              </>
            )}

            <p className="auth-legal" style={{ marginTop: '32px' }}>
              By continuing, you agree to our <a href="#">privacy policy</a> and <a href="#">terms of use</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
