import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../api/axios.js';

const strengthScore = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState('email'); // 'email' | 'phone' | 'google'
  const [step, setStep] = useState(1); // 1=form, 2=otp, 3=success
  const [showPw, setShowPw] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', businessName: '', agreed: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const pw = form.password;
  const strength = strengthScore(pw);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#1dbf73'][strength];

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOTP = async () => {
    const identifier = method === 'email' ? form.email : form.phone;
    if (!identifier) { toast.error(`Please enter your ${method} first.`); return; }
    setSending(true);
    try {
      await api.post('/auth/send-otp', { identifier, type: method, purpose: 'signup' });
      setStep(2);
      setCountdown(60);
      toast.success(`OTP sent to your ${method}!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send OTP.'); }
    finally { setSending(false); }
  };

  const verifyOTP = async () => {
    const identifier = method === 'email' ? form.email : form.phone;
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { identifier, otp, purpose: 'signup' });
      setOtpVerified(true);
      toast.success('Verified! Creating your account...', { toastId: 'otp-verified' });
      await handleSignup();
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP.'); }
    finally { setLoading(false); }
  };

  const handleSignup = async () => {
    if (form.password !== form.confirm) { toast.error('Passwords do not match.'); return; }
    if (!form.agreed) { toast.error('Please agree to the terms.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        businessName: form.businessName,
      });
      await login(data.accessToken, data.refreshToken, data.user);
      setStep(3);
    } catch (err) { toast.error(err.response?.data?.message || 'Signup failed.'); }
    finally { setLoading(false); }
  };

  const handleDirectSignup = async (e) => {
    e.preventDefault();
    if (method === 'email' || method === 'phone') {
      // Require OTP verification first
      await sendOTP();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f9ff 0%,#f8fafc 50%,#f0fdf4 100%)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="glow-blob blob-1" style={{ width: 600, height: 600, opacity: 0.05 }} />
        <div className="glow-blob blob-2" style={{ width: 400, height: 400, opacity: 0.04 }} />
      </div>

      {/* Header */}
      <header style={{ padding: '20px 32px', position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark-blue)', textDecoration: 'none' }}>
          <span style={{ color: 'var(--secondary-color)' }}>Cruzen</span>Digital
        </Link>
        <Link to="/login" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-light)', textDecoration: 'none' }}>
          Already a member? <span style={{ color: 'var(--secondary-color)' }}>Sign in →</span>
        </Link>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 480, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.55s cubic-bezier(0.16,1,0.3,1)' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600, marginBottom: 16, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--secondary-color)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-light)'}>
            <i className="fas fa-arrow-left" style={{ fontSize: '0.75rem' }} /> Back to Home
          </Link>

          {/* Step 3: Success */}
          {step === 3 ? (
            <div style={{ background: '#fff', borderRadius: 24, padding: '50px 36px', boxShadow: '0 24px 80px rgba(2,43,80,0.10)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2rem', color: '#fff', boxShadow: '0 12px 32px rgba(29,191,115,0.35)', animation: 'successPop 0.5s ease' }}>
                <i className="fas fa-check" />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 10 }}>Account Created!</h2>
              <p style={{ color: 'var(--text-light)', marginBottom: 8 }}>Welcome to Cruzen Digital! Check your email for a welcome message and 2FA setup instructions.</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: 28 }}>📧 A welcome email has been sent to <strong>{form.email}</strong></p>
              <button onClick={() => navigate('/dashboard')} className="btn btn-consult"
                style={{ padding: '14px 32px', fontSize: '0.95rem', gap: 8 }}>
                Go to Dashboard <i className="fas fa-arrow-right" />
              </button>
            </div>
          ) : step === 2 ? (
            /* Step 2: OTP Verification */
            <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', boxShadow: '0 24px 80px rgba(2,43,80,0.10)', border: '1px solid var(--border-color)' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,180,204,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.6rem', color: 'var(--secondary-color)', animation: 'successPop 0.4s ease' }}>
                  <i className={`fas fa-${method === 'email' ? 'envelope' : 'mobile-alt'}`} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 6 }}>Verify Your {method === 'email' ? 'Email' : 'Phone'}</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                  Code sent to <strong>{method === 'email' ? form.email : form.phone}</strong>
                </p>
              </div>

              <div className="form-field">
                <label>Enter 6-digit OTP</label>
                <input type="text" inputMode="numeric" maxLength={6} placeholder="· · · · · ·"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: 12, fontWeight: 800, padding: '16px' }} autoFocus />
              </div>

              <button onClick={verifyOTP} disabled={loading || otp.length !== 6} className="btn btn-consult"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem', gap: 8, borderRadius: 12, marginBottom: 12 }}>
                {loading ? <><span className="spinner-sm" /> Verifying...</> : 'Verify & Create Account'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => { setStep(1); setOtp(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit' }}>
                  ← Change details
                </button>
                <button onClick={sendOTP} disabled={countdown > 0 || sending} style={{ background: 'none', border: 'none', cursor: countdown > 0 ? 'not-allowed' : 'pointer', color: countdown > 0 ? 'var(--text-light)' : 'var(--secondary-color)', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit' }}>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          ) : (
            /* Step 1: Sign Up Form */
            <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', boxShadow: '0 24px 80px rgba(2,43,80,0.10)', border: '1px solid var(--border-color)' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 4 }}>Create Account</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Join 500+ businesses scaling with Cruzen Digital</p>
              </div>

              {/* Google Button */}
              <a href="/api/auth/google"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '13px', border: '1.5px solid var(--border-color)', borderRadius: 12, background: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, color: 'var(--dark-blue)', marginBottom: 20, textDecoration: 'none', transition: 'all 0.25s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(66,133,244,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </a>

              <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.82rem', margin: '0 0 20px', position: 'relative' }}>
                <span style={{ background: '#fff', padding: '0 12px', position: 'relative', zIndex: 1 }}>or create manually</span>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border-color)' }} />
              </div>

              {/* Method toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[['email', 'fa-envelope', 'Email'], ['phone', 'fa-phone', 'Phone']].map(([k, icon, label]) => (
                  <button key={k} type="button" onClick={() => setMethod(k)}
                    style={{ flex: 1, padding: '9px', border: `1.5px solid ${method === k ? 'var(--secondary-color)' : 'var(--border-color)'}`, borderRadius: 10, background: method === k ? 'rgba(0,180,204,0.06)' : '#fff', color: method === k ? 'var(--secondary-color)' : 'var(--text-light)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                    <i className={`fas ${icon}`} style={{ marginRight: 6 }} />{label} + OTP
                  </button>
                ))}
              </div>

              <form onSubmit={handleDirectSignup}>
                <div className="form-group-row">
                  <div className="form-field">
                    <label>Full Name *</label>
                    <input type="text" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} required />
                  </div>
                  <div className="form-field">
                    <label>Business Name</label>
                    <input type="text" placeholder="Company (optional)" value={form.businessName} onChange={e => set('businessName', e.target.value)} />
                  </div>
                </div>

                {method === 'email' ? (
                  <div className="form-field">
                    <label>Email Address *</label>
                    <input type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} required autoComplete="email" />
                  </div>
                ) : (
                  <div className="form-field">
                    <label>Phone Number *</label>
                    <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                  </div>
                )}

                {/* Also collect email if phone method selected */}
                {method === 'phone' && (
                  <div className="form-field">
                    <label>Email Address *</label>
                    <input type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                  </div>
                )}

                <div className="form-field">
                  <label>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} style={{ paddingRight: 44 }} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.9rem', padding: 0 }}>
                      <i className={`fas fa-eye${showPw ? '-slash' : ''}`} />
                    </button>
                  </div>
                  {pw.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: strength >= i ? strengthColor : 'var(--border-color)', transition: 'background 0.3s' }} />
                        ))}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: strengthColor, fontWeight: 600, marginTop: 4 }}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label>Confirm Password *</label>
                  <input type="password" placeholder="Repeat password" value={form.confirm} onChange={e => set('confirm', e.target.value)} required autoComplete="new-password" />
                  {form.confirm && form.password !== form.confirm && (
                    <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4, fontWeight: 600 }}>Passwords don't match</p>
                  )}
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
                  <input type="checkbox" checked={form.agreed} onChange={e => set('agreed', e.target.checked)} style={{ marginTop: 3, accentColor: 'var(--primary-color)', width: 16, height: 16 }} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.5 }}>
                    I agree to the <Link to="/terms" style={{ color: 'var(--secondary-color)', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</Link> and <Link to="/privacy" style={{ color: 'var(--secondary-color)', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link>
                  </span>
                </label>

                <button type="submit" disabled={sending || loading} className="btn btn-consult"
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem', gap: 8, borderRadius: 12 }}>
                  {sending ? <><span className="spinner-sm" /> Sending OTP...</> : 'Send OTP & Continue →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-light)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--secondary-color)', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp float */}
      <a href="https://wa.me/919560310393" target="_blank" rel="noopener noreferrer"
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, width: 56, height: 56, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#fff', boxShadow: '0 8px 24px rgba(37,211,102,0.45)', textDecoration: 'none', transition: 'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <i className="fab fa-whatsapp" />
      </a>
    </div>
  );
}
