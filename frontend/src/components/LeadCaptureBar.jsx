import { useState, useEffect } from 'react';
import api from '../api/axios.js';

const KEY = 'cruzen_bar_shown';

export default function LeadCaptureBar() {
  const [visible, setVisible]   = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail]       = useState('');
  const [name, setName]         = useState('');
  const [step, setStep]         = useState(1); // 1=email, 2=name, 3=done
  const [busy, setBusy]         = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(KEY)) return;
    const t = setTimeout(() => setVisible(true), 45000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(KEY, '1');
  };

  const handleEmail = (e) => {
    e.preventDefault();
    if (!email) return;
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/leads', {
        name: name || 'Unknown',
        email,
        message: 'Submitted via sticky lead capture bar',
        source: 'sticky_bar',
      });
    } catch { /* silent */ } finally { setBusy(false); }
    setStep(3);
    sessionStorage.setItem(KEY, '1');
    setTimeout(dismiss, 3500);
  };

  if (!visible || dismissed) return null;

  return (
    <div className="lcb">
      <div className="lcb-inner">
        {step === 3 ? (
          <div className="lcb-done">
            <span>🎉 We'll reach out shortly! Check your WhatsApp or email.</span>
            <button className="lcb-dismiss" onClick={dismiss}>✕</button>
          </div>
        ) : (
          <>
            <div className="lcb-left">
              <div className="lcb-pulse" />
              <span className="lcb-headline">Get a <strong>Free Marketing Audit</strong> — limited slots this week</span>
            </div>
            {step === 1 ? (
              <form className="lcb-form" onSubmit={handleEmail}>
                <input className="lcb-input" type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} required />
                <button type="submit" className="lcb-btn">Get Free Audit →</button>
              </form>
            ) : (
              <form className="lcb-form" onSubmit={handleSubmit}>
                <input className="lcb-input" placeholder="Your name or brand name" value={name} onChange={e => setName(e.target.value)} />
                <button type="submit" className="lcb-btn" disabled={busy}>{busy ? 'Sending…' : 'Submit →'}</button>
              </form>
            )}
            <button className="lcb-dismiss" onClick={dismiss} aria-label="Close">✕</button>
          </>
        )}
      </div>
    </div>
  );
}
