import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password, 4=done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Check your email.');
    } finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/verify-reset-otp', { email, otp });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { email, otp, password });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally { setLoading(false); }
  };

  const pageStyle = {
    minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4f8 0%, #e8f0fe 100%)',
    display: 'flex', flexDirection: 'column',
  };

  const cardStyle = {
    background: '#fff', borderRadius: 24, padding: '40px 36px',
    boxShadow: '0 24px 80px rgba(2,43,80,0.10)', border: '1px solid var(--border-color)',
    width: '100%', maxWidth: 420,
    opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)',
    transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
  };

  return (
    <div style={pageStyle}>
      <header style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark-blue)', textDecoration: 'none' }}>
          <span style={{ color: 'var(--secondary-color)' }}>Cruzen</span>Digital
        </Link>
        <Link to="/login" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-light)', textDecoration: 'none' }}>
          ← Back to login
        </Link>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
        <div style={cardStyle}>
          {step === 4 ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.8rem', color: '#fff' }}>
                <i className="fas fa-check" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 8 }}>Password Reset!</h2>
              <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>Your password has been updated successfully.</p>
              <Link to="/login" className="btn btn-consult" style={{ display: 'inline-flex', padding: '12px 32px', borderRadius: 12, textDecoration: 'none', justifyContent: 'center' }}>
                Sign In Now →
              </Link>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,180,204,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--secondary-color)', fontSize: '1.4rem' }}>
                  <i className={step === 1 ? 'fas fa-lock' : step === 2 ? 'fas fa-shield-alt' : 'fas fa-key'} />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 4 }}>
                  {step === 1 ? 'Forgot Password' : step === 2 ? 'Enter OTP' : 'New Password'}
                </h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
                  {step === 1 ? "We'll send a reset code to your email."
                   : step === 2 ? `Code sent to ${email}. Check your inbox.`
                   : 'Choose a strong new password.'}
                </p>
              </div>

              {/* Progress dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                {[1, 2, 3].map(s => (
                  <div key={s} style={{ width: s === step ? 24 : 8, height: 8, borderRadius: 4, background: s <= step ? 'var(--secondary-color)' : 'var(--border-color)', transition: 'all 0.3s' }} />
                ))}
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem', marginBottom: 16, fontWeight: 600 }}>
                  <i className="fas fa-exclamation-circle" style={{ marginRight: 8 }} />{error}
                </div>
              )}

              {step === 1 && (
                <form onSubmit={sendOtp}>
                  <div className="form-field">
                    <label>Email Address</label>
                    <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                  </div>
                  <button type="submit" disabled={loading} className="btn btn-consult" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem', borderRadius: 12, marginTop: 4 }}>
                    {loading ? <><span className="spinner-sm" /> Sending...</> : 'Send Reset Code →'}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={verifyOtp}>
                  <div className="form-field">
                    <label>6-Digit Code</label>
                    <input type="text" inputMode="numeric" maxLength={6} placeholder="· · · · · ·" value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      style={{ textAlign: 'center', fontSize: '1.6rem', letterSpacing: 10, fontWeight: 800, padding: '14px' }} autoFocus />
                  </div>
                  <button type="submit" disabled={loading || otp.length !== 6} className="btn btn-consult" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem', borderRadius: 12, marginTop: 4 }}>
                    {loading ? <><span className="spinner-sm" /> Verifying...</> : 'Verify Code →'}
                  </button>
                  <button type="button" onClick={() => setStep(1)} style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                    ← Change email
                  </button>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={resetPassword}>
                  <div className="form-field">
                    <label>New Password</label>
                    <input type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
                  </div>
                  <div className="form-field">
                    <label>Confirm Password</label>
                    <input type="password" placeholder="Repeat new password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                  </div>
                  <button type="submit" disabled={loading} className="btn btn-consult" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem', borderRadius: 12, marginTop: 4 }}>
                    {loading ? <><span className="spinner-sm" /> Saving...</> : 'Reset Password →'}
                  </button>
                </form>
              )}
            </>
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
