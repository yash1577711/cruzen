import { useState, useEffect } from 'react';
import api from '../api/axios.js';

const STORAGE_KEY = 'cruzen_popup_last_shown';

function shouldShow(frequency) {
  if (frequency === 'always') return true;
  const last = localStorage.getItem(STORAGE_KEY);
  if (!last) return true;
  if (frequency === 'once_per_session') return false;
  if (frequency === 'once_per_day') {
    const diff = Date.now() - parseInt(last, 10);
    return diff > 24 * 60 * 60 * 1000;
  }
  return true;
}

export default function PromoPopup({ openConsultation }) {
  const [popup, setPopup]   = useState(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let timerDone = false;
    let popupData = null;
    let active = true;

    const tryShow = () => {
      if (timerDone && popupData && active) {
        setPopup(popupData);
        setMounted(true);
        requestAnimationFrame(() => setVisible(true));
      }
    };

    const t = setTimeout(() => { timerDone = true; tryShow(); }, 2000);

    api.get('/popup')
      .then(r => {
        const p = r.data.popup;
        if (!p || !p.enabled || !shouldShow(p.showFrequency)) return;
        popupData = p;
        tryShow();
      })
      .catch(() => {});

    return () => { active = false; clearTimeout(t); };
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(() => setMounted(false), 320);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  const handleCta = () => {
    close();
    setTimeout(() => openConsultation(), 340);
  };

  if (!mounted || !popup) return null;

  return (
    <div
      className={`promo-overlay${visible ? ' promo-overlay--in' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div className={`promo-modal${visible ? ' promo-modal--in' : ''}`}>
        <button className="promo-close" onClick={close} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {popup.imageUrl && (
          <div className="promo-img-wrap">
            <img src={popup.imageUrl} alt="Promotion" className="promo-img" />
          </div>
        )}

        <div className="promo-body">
          <div className="promo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.35a16 16 0 0 0 5.56 5.56l1.14-1.14a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.03z"/>
            </svg>
          </div>
          <h3 className="promo-title">{popup.title}</h3>
          <p className="promo-sub">{popup.subtitle}</p>
          <button className="promo-cta" onClick={handleCta}>
            {popup.ctaText}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="promo-skip" onClick={close}>No thanks, maybe later</button>
        </div>
      </div>
    </div>
  );
}
