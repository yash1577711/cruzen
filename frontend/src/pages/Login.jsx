import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../api/axios.js';

export default function Login() {
  const { login, isStaff, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  // Already logged in — send to correct destination
  useEffect(() => {
    if (!authLoading && user) {
      const dest = ['admin', 'sub-admin'].includes(user.role) ? '/admin' : '/dashboard';
      navigate(dest, { replace: true });
    }
  }, [user, authLoading]);

  const [tab, setTab] = useState('password');
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [otpType, setOtpType] = useState('email');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFAEmail, setTwoFAEmail] = useState('');
  const [twoFAOtp, setTwoFAOtp] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    if (searchParams.get('error')) toast.error('Google sign-in failed. Please try again.', { toastId: 'google-error' });
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.require2FA) {
        setTwoFAEmail(email);
        setShow2FA(true);
        toast.info('2FA code sent to your email.');
        return;
      }
      await login(data.accessToken, data.refreshToken, data.user);
      toast.success('Welcome back!', { toastId: 'login-success' });
      const dest = ['admin', 'sub-admin'].includes(data.user.role) ? '/admin' : redirect;
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.', { toastId: 'login-error' });
    } finally { setLoading(false); }
  };

  const sendOTP = async () => {
    if (!identifier.trim()) { toast.error('Enter your email or phone first.'); return; }
    setSending(true);
    try {
      await api.post('/auth/send-otp', { identifier: identifier.trim(), type: otpType, purpose: 'login' });
      setOtpSent(true);
      setCountdown(60);
      toast.success(`OTP sent to your ${otpType}!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send OTP.'); }
    finally { setSending(false); }
  };

  const handleOTPLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login-otp', { identifier: identifier.trim(), otp, type: otpType });
      await login(data.accessToken, data.refreshToken, data.user);
      toast.success('Welcome back!', { toastId: 'login-success' });
      const dest = ['admin', 'sub-admin'].includes(data.user.role) ? '/admin' : redirect;
      navigate(dest, { replace: true });
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP.', { toastId: 'login-error' }); }
    finally { setLoading(false); }
  };

  const handle2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-2fa', { email: twoFAEmail, otp: twoFAOtp });
      await login(data.accessToken, data.refreshToken, data.user);
      toast.success('Verified! Welcome back.', { toastId: 'login-success' });
      const dest = ['admin', 'sub-admin'].includes(data.user.role) ? '/admin' : redirect;
      navigate(dest, { replace: true });
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid 2FA code.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f9ff 0%,#f8fafc 50%,#f0fdf4 100%)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Animated blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="glow-blob blob-1" style={{ width: 600, height: 600, opacity: 0.05 }} />
        <div className="glow-blob blob-2" style={{ width: 400, height: 400, opacity: 0.04 }} />
      </div>

      {/* Header */}
      <header style={{ padding: '20px 32px', position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--secondary-color)' }}>Cruzen</span>Digital
        </Link>
        <Link to="/signup" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-light)', textDecoration: 'none' }}>
          No account? <span style={{ color: 'var(--secondary-color)' }}>Sign up free →</span>
        </Link>
      </header>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 440, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.55s cubic-bezier(0.16,1,0.3,1)' }}>

          {show2FA ? (
            /* ── 2FA Screen ── */
            <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', boxShadow: '0 24px 80px rgba(2,43,80,0.10)', border: '1px solid var(--border-color)' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.8rem', color: '#fff', boxShadow: '0 8px 24px rgba(29,191,115,0.3)', animation: 'successPop 0.4s ease' }}>
                  <i className="fas fa-shield-alt" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 6 }}>Two-Factor Auth</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Code sent to <strong>{twoFAEmail}</strong></p>
              </div>
              <form onSubmit={handle2FA}>
                <div className="form-field">
                  <label>6-Digit Code</label>
                  <input type="text" inputMode="numeric" maxLength={6} placeholder="· · · · · ·"
                    value={twoFAOtp} onChange={e => setTwoFAOtp(e.target.value.replace(/\D/g, ''))}
                    style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: 12, fontWeight: 800, padding: '14px' }} autoFocus />
                </div>
                <button type="submit" disabled={loading || twoFAOtp.length !== 6} className="btn btn-consult"
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem', gap: 8, marginTop: 8 }}>
                  {loading ? <><span className="spinner-sm" /> Verifying...</> : 'Verify & Login'}
                </button>
              </form>
              <button onClick={() => setShow2FA(false)} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'underline' }}>
                ← Back to login
              </button>
            </div>
          ) : (
            /* ── Main Login Card ── */
            <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', boxShadow: '0 24px 80px rgba(2,43,80,0.10)', border: '1px solid var(--border-color)' }}>

              {searchParams.get('redirect') && (
                <div style={{ background: 'rgba(0,180,204,0.08)', border: '1px solid rgba(0,180,204,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: '0.85rem', color: 'var(--secondary-color)', fontWeight: 600, textAlign: 'center', marginBottom: 20 }}>
                  <i className="fas fa-lock" style={{ marginRight: 8 }} />Sign in to continue to checkout
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 4 }}>Welcome Back</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Sign in to your Cruzen Digital account</p>
              </div>

              {/* Google Button */}
              <a href="/api/auth/google"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '13px', border: '1.5px solid var(--border-color)', borderRadius: 12, background: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, color: 'var(--dark-blue)', marginBottom: 20, textDecoration: 'none', transition: 'all 0.25s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(66,133,244,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </a>

              <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.82rem', margin: '0 0 20px', position: 'relative' }}>
                <span style={{ background: '#fff', padding: '0 12px', position: 'relative', zIndex: 1 }}>or continue with</span>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border-color)' }} />
              </div>

              {/* Tab selector */}
              <div style={{ display: 'flex', background: 'var(--bg-light)', borderRadius: 10, padding: 4, marginBottom: 22 }}>
                {[['password', 'fa-lock', 'Password'], ['otp', 'fa-mobile-alt', 'OTP Login']].map(([k, icon, label]) => (
                  <button key={k} onClick={() => { setTab(k); setOtpSent(false); setOtp(''); }}
                    style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: tab === k ? '#fff' : 'none', color: tab === k ? 'var(--dark-blue)' : 'var(--text-light)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.25s', boxShadow: tab === k ? 'var(--shadow-sm)' : 'none', fontFamily: 'inherit' }}>
                    <i className={`fas ${icon}`} style={{ marginRight: 6 }} />{label}
                  </button>
                ))}
              </div>

              {/* Password form */}
              {tab === 'password' && (
                <form onSubmit={handlePasswordLogin} style={{ animation: 'stepSlideIn 0.35s ease' }}>
                  <div className="form-field">
                    <label>Email Address</label>
                    <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                  </div>
                  <div className="form-field">
                    <label>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPw ? 'text' : 'password'} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 44 }} autoComplete="current-password" />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.9rem', padding: 0 }}>
                        <i className={`fas fa-eye${showPw ? '-slash' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn btn-consult"
                    style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem', gap: 8, marginTop: 4, borderRadius: 12 }}>
                    {loading ? <><span className="spinner-sm" /> Signing in...</> : <><i className="fas fa-sign-in-alt" /> Sign In</>}
                  </button>
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--text-light)', textDecoration: 'none', fontWeight: 600 }}>
                      Forgot password?
                    </Link>
                  </div>
                </form>
              )}

              {/* OTP form */}
              {tab === 'otp' && (
                <div style={{ animation: 'stepSlideIn 0.35s ease' }}>
                  {/* Email / Phone toggle */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[['email', 'fa-envelope', 'Email'], ['phone', 'fa-phone', 'Phone']].map(([k, icon, label]) => (
                      <button key={k} type="button" onClick={() => { setOtpType(k); setOtpSent(false); setIdentifier(''); setOtp(''); }}
                        style={{ flex: 1, padding: '10px', border: `1.5px solid ${otpType === k ? 'var(--secondary-color)' : 'var(--border-color)'}`, borderRadius: 10, background: otpType === k ? 'rgba(0,180,204,0.06)' : '#fff', color: otpType === k ? 'var(--secondary-color)' : 'var(--text-light)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                        <i className={`fas ${icon}`} style={{ marginRight: 6 }} />{label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleOTPLogin}>
                    <div className="form-field">
                      <label>{otpType === 'email' ? 'Email Address' : 'Phone Number'}</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type={otpType === 'email' ? 'email' : 'tel'} placeholder={otpType === 'email' ? 'you@example.com' : '+91 98765 43210'}
                          value={identifier} onChange={e => setIdentifier(e.target.value)} required style={{ flex: 1 }} />
                        <button type="button" onClick={sendOTP} disabled={sending || countdown > 0}
                          style={{ padding: '0 18px', borderRadius: 8, background: countdown > 0 ? 'var(--bg-light)' : 'var(--dark-blue)', color: countdown > 0 ? 'var(--text-light)' : '#fff', border: '1px solid var(--border-color)', fontWeight: 700, fontSize: '0.8rem', cursor: sending || countdown > 0 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', minWidth: 80, fontFamily: 'inherit', transition: 'all 0.2s' }}>
                          {sending ? '...' : countdown > 0 ? `${countdown}s` : 'Send OTP'}
                        </button>
                      </div>
                    </div>

                    {otpSent && (
                      <div className="form-field" style={{ animation: 'stepSlideIn 0.4s ease' }}>
                        <label>Enter OTP</label>
                        <input type="text" inputMode="numeric" maxLength={6} placeholder="· · · · · ·"
                          value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                          style={{ textAlign: 'center', fontSize: '1.6rem', letterSpacing: 10, fontWeight: 800, padding: '14px' }} autoFocus />
                        <button type="submit" disabled={loading || otp.length !== 6} className="btn btn-consult"
                          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem', gap: 8, marginTop: 8, borderRadius: 12 }}>
                          {loading ? <><span className="spinner-sm" /> Verifying...</> : 'Verify & Sign In'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-light)' }}>
                Don't have an account?{' '}
                <Link to="/signup" style={{ color: 'var(--secondary-color)', fontWeight: 700, textDecoration: 'none' }}>Sign up free →</Link>
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
