import { useState, useEffect } from 'react';
import api from '../api/axios.js';

// config shape:
// { delay, badge, title, subtitle, fields:[{name,placeholder,type}], ctaText, source, storageKey }
export default function LeadPopup({ config }) {
  const { delay = 8000, badge, title, subtitle, fields = [], ctaText, source, storageKey } = config;
  const [mounted, setMounted]   = useState(false);
  const [visible, setVisible]   = useState(false);
  const [form,    setForm]      = useState({});
  const [done,    setDone]      = useState(false);
  const [busy,    setBusy]      = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(storageKey)) return;
    const t = setTimeout(() => {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    }, delay);
    return () => clearTimeout(t);
  }, [delay, storageKey]);

  const close = () => {
    setVisible(false);
    sessionStorage.setItem(storageKey, '1');
    setTimeout(() => setMounted(false), 320);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/leads', { ...form, source, message: `Lead from ${source}` });
    } catch { /* silent */ } finally { setBusy(false); }
    setDone(true);
    sessionStorage.setItem(storageKey, '1');
  };

  if (!mounted) return null;

  return (
    <div
      className={`lp-overlay${visible ? ' lp-overlay--in' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div className={`lp-modal${visible ? ' lp-modal--in' : ''}`}>
        <button className="lp-close" onClick={close} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {done ? (
          <div className="lp-done">
            <div className="lp-done-icon">🎉</div>
            <h3 className="lp-done-title">We'll be in touch soon!</h3>
            <p className="lp-done-sub">Our team will reach out within 2 hours. Check your WhatsApp!</p>
            <button className="lp-done-btn" onClick={close}>Great, thanks!</button>
          </div>
        ) : (
          <>
            <div className="lp-badge">{badge}</div>
            <h3 className="lp-title">{title}</h3>
            <p className="lp-sub">{subtitle}</p>
            <form className="lp-form" onSubmit={handleSubmit}>
              {fields.map(f => (
                <input
                  key={f.name}
                  className="lp-input"
                  type={f.type || 'text'}
                  placeholder={f.placeholder}
                  value={form[f.name] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                  required
                />
              ))}
              <button type="submit" className="lp-submit" disabled={busy}>
                {busy ? 'Sending…' : ctaText}
              </button>
            </form>
            <button className="lp-skip" onClick={close}>No thanks, maybe later</button>
          </>
        )}
      </div>
    </div>
  );
}
