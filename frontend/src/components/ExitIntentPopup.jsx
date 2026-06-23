import { useState, useEffect, useRef } from 'react';
import api from '../api/axios.js';

const KEY = 'cruzen_exit_shown';

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [form, setForm]   = useState({ name: '', phone: '' });
  const [done, setDone]   = useState(false);
  const [busy, setBusy]   = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem(KEY)) return;
    // Only arm after 6 seconds so it doesn't fire on accidental quick mouse-outs
    const arm = setTimeout(() => { readyRef.current = true; }, 6000);

    const onMouseOut = (e) => {
      if (!readyRef.current) return;
      if (e.clientY > 10) return; // only trigger at top of viewport
      sessionStorage.setItem(KEY, '1');
      readyRef.current = false;
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    };

    document.addEventListener('mouseleave', onMouseOut);
    return () => { clearTimeout(arm); document.removeEventListener('mouseleave', onMouseOut); };
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(() => setMounted(false), 320);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setBusy(true);
    try {
      await api.post('/leads', {
        name: form.name, phone: form.phone,
        message: 'Requested free marketing audit via exit intent popup',
        source: 'exit_intent',
      });
    } catch { /* silent */ } finally { setBusy(false); }
    setDone(true);
  };

  if (!mounted) return null;

  return (
    <div className={`ei-overlay${visible ? ' ei-overlay--in' : ''}`} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className={`ei-modal${visible ? ' ei-modal--in' : ''}`}>
        <button className="ei-close" onClick={close} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {done ? (
          <div className="ei-done">
            <div className="ei-done-icon">🎉</div>
            <h3>You're in!</h3>
            <p>Our team will reach out within 2 hours with your free audit. Check your WhatsApp!</p>
            <button className="ei-done-btn" onClick={close}>Great, thanks!</button>
          </div>
        ) : (
          <>
            <div className="ei-badge">FREE OFFER</div>
            <h3 className="ei-title">Wait — get a <span className="ei-accent">Free Marketing Audit</span> before you go</h3>
            <p className="ei-sub">We'll analyse your current digital presence and tell you exactly where you're leaving money on the table. No cost, no catch.</p>
            <form className="ei-form" onSubmit={handleSubmit}>
              <input
                className="ei-input"
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                className="ei-input"
                placeholder="WhatsApp number"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required
              />
              <button type="submit" className="ei-submit" disabled={busy}>
                {busy ? 'Submitting…' : 'Claim My Free Audit →'}
              </button>
            </form>
            <button className="ei-skip" onClick={close}>No thanks, I'll figure it out myself</button>
          </>
        )}
      </div>
    </div>
  );
}
