import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toast } from 'react-toastify';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ConsultationModal from '../components/ConsultationModal.jsx';
import Chatbot from '../components/Chatbot.jsx';
import api from '../api/axios.js';
import { findService, categoryOf, journeySteps, keyBenefits } from '../data/services.js';

/* ── useReveal: fires once when element enters viewport ── */
function useReveal(threshold = 0.2) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── animated counter ── */
function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useReveal(0.5);
  useEffect(() => {
    if (!visible) return;
    const num = parseInt(target.replace(/\D/g, ''), 10);
    if (!num) { setVal(target); return; }
    let start = 0;
    const step = Math.ceil(num / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setVal(target); clearInterval(timer); }
      else setVal(start + suffix);
    }, 30);
    return () => clearInterval(timer);
  }, [visible, target, suffix]);
  return <span ref={ref}>{visible ? val : 0}</span>;
}

/* ── benefit card with reveal ── */
function BenefitCard({ b, index, color }) {
  const [ref, visible] = useReveal(0.15);
  return (
    <div
      ref={ref}
      className={`sl-benefit-card${visible ? ' sl-visible' : ''}`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <div className="sl-benefit-icon" style={{ background: `${color}15`, color }}>
        <i className={b.icon} />
      </div>
      <h4 className="sl-benefit-title">{b.title}</h4>
      <p className="sl-benefit-desc">{b.desc}</p>
    </div>
  );
}

/* ── journey step ── */
function JourneyStep({ step, index, total, color }) {
  const [ref, visible] = useReveal(0.15);
  return (
    <div
      ref={ref}
      className={`sl-journey-step${visible ? ' sl-visible' : ''}`}
      style={{ transitionDelay: `${index * 0.15}s` }}
    >
      <div className="sl-step-num" style={{ background: visible ? color : '#d1d5db', transition: `background 0.4s ${index * 0.15}s` }}>{index + 1}</div>
      <div className="sl-step-icon" style={{ color }}>
        <i className={step.icon} />
      </div>
      <h4 className="sl-step-title">{step.title}</h4>
      <p className="sl-step-desc">{step.desc}</p>
      {index < total - 1 && (
        <div className={`sl-step-connector${visible ? ' sl-connector-drawn' : ''}`} style={{ '--connector-color': color, transitionDelay: `${index * 0.15 + 0.3}s` }} />
      )}
    </div>
  );
}

/* ── plan card with reveal ── */
function PlanCard({ plan, svcTitle, onConsult, onBuy, canBuy, index }) {
  const [ref, visible] = useReveal(0.1);
  return (
    <div
      ref={ref}
      className={`sl-plan${plan.popular ? ' sl-plan-popular' : ''}${visible ? ' sl-visible' : ''}`}
      style={{ transitionDelay: `${index * 0.12}s` }}
    >
      {plan.popular && <div className="sl-plan-badge">Most Popular</div>}
      <div className="sl-plan-name">{plan.name}</div>
      <div className="sl-plan-pricing">
        <span className="sl-plan-price">₹{plan.price.toLocaleString('en-IN')}</span>
        <span className="sl-plan-original">₹{plan.original.toLocaleString('en-IN')}</span>
        <span className="sl-plan-save">Save {Math.round((1 - plan.price / plan.original) * 100)}%</span>
      </div>
      <ul className="sl-plan-features">
        {plan.features.map((f, i) => (
          <li key={i}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            {f}
          </li>
        ))}
      </ul>
      <div className="sl-plan-btns">
        {canBuy && (
          <button className="sl-btn-buy" onClick={() => onBuy({ label: `${svcTitle} — ${plan.name} Plan`, price: plan.price, service: svcTitle, planName: plan.name })}>
            Buy Now
          </button>
        )}
        <button className={`sl-btn-consult${plan.popular ? ' sl-btn-primary' : ''}`} onClick={() => onConsult(`${svcTitle} — ${plan.name} Plan`)}>
          Free Consultation
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function ServiceLanding() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const svc = findService(id);
  const cat = svc ? categoryOf(svc) : null;
  const steps = svc ? journeySteps(svc) : [];
  const benefits = svc ? keyBenefits(svc) : [];

  const [consultOpen, setConsultOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [paying, setPaying] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); setHeroLoaded(false); const t = setTimeout(() => setHeroLoaded(true), 80); return () => clearTimeout(t); }, [id]);

  useEffect(() => {
    if (!user) return;
    const intent = localStorage.getItem('cruzen_buy_intent');
    if (!intent) return;
    let plan;
    try { plan = JSON.parse(intent); } catch { plan = null; }
    localStorage.removeItem('cruzen_buy_intent');
    if (plan) setPayModal(plan);
  }, [user]);

  if (!svc) {
    return (
      <>
        <Header />
        <div style={{ padding: '120px 24px', textAlign: 'center' }}>
          <h2>Service not found</h2>
          <Link to="/services" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-block' }}>Browse All Services</Link>
        </div>
        <Footer />
      </>
    );
  }

  const canBuy = !user || user.role === 'user';
  const openConsult = (service = null) => { setPreSelectedService(service); setConsultOpen(true); };

  const handleBuyNow = (plan) => {
    if (!user) {
      localStorage.setItem('cruzen_buy_intent', JSON.stringify(plan));
      navigate(`/login?redirect=/services/${id}`);
      return;
    }
    if (!canBuy) { toast.info('Service purchases are available for clients only.', { toastId: 'staff-buy-block' }); return; }
    setPayModal(plan);
  };

  const submitPayUForm = (payuUrl, params) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = payuUrl;
    Object.entries(params).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = key; input.value = String(value ?? '');
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  const handleProceedToPayment = async () => {
    if (!payModal || paying) return;
    setPaying(true);
    try {
      const createRes = await api.post('/orders/create', { serviceName: payModal.service, planName: payModal.planName, amount: payModal.price });
      const { order, razorpayOrderId, testMode: rzpTestMode } = createRes.data;
      try {
        const payuRes = await api.post('/orders/payu/init', { orderId: order._id });
        const { payuUrl, params, testMode: payuTestMode } = payuRes.data;
        if (!payuTestMode) { setPayModal(null); submitPayUForm(payuUrl, params); return; }
      } catch (payuErr) { console.warn('PayU fallback:', payuErr.message); }
      await api.post('/orders/verify', { razorpayOrderId, razorpayPaymentId: `demo_pay_${Date.now()}`, razorpaySignature: `demo_sig_${Date.now()}`, orderId: order._id, testMode: rzpTestMode !== false });
      setPayModal(null);
      toast.success('Payment confirmed! Your order is now active.', { toastId: 'pay-success' });
      navigate('/dashboard?tab=tracker');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.', { toastId: 'pay-error' });
    } finally { setPaying(false); }
  };

  return (
    <>
      <Header openConsultation={() => openConsult()} />

      {/* ══ HERO ══ */}
      <section className="sl-hero">
        <img src={svc.image} alt={svc.title} className="sl-hero-img sl-hero-zoom" />
        <div className="sl-hero-overlay" />
        <div className={`sl-hero-content${heroLoaded ? ' sl-hero-loaded' : ''}`}>
          <div className="sl-hero-breadcrumb">
            <Link to="/services">All Services</Link>
            <span>/</span>
            <span style={{ color: cat.color }}>{cat.label}</span>
          </div>
          <span className="sl-hero-tag" style={{ background: cat.color }}>{svc.tag}</span>
          <h1 className="sl-hero-title">{svc.title}</h1>
          <p className="sl-hero-desc">{svc.desc}</p>
          <div className="sl-hero-actions">
            <button className="sl-hero-btn-primary" onClick={() => document.getElementById('sl-pricing').scrollIntoView({ behavior: 'smooth' })}>
              View Plans & Pricing
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            </button>
            <button className="sl-hero-btn-outline" onClick={() => openConsult(svc.title)}>
              Free Consultation
            </button>
          </div>
        </div>
        <div className={`sl-hero-price-pill${heroLoaded ? ' sl-pill-loaded' : ''}`}>
          <span className="sl-hero-price-from">Starting from</span>
          <span className="sl-hero-price-val">₹{Math.min(...svc.plans.map(p => p.price)).toLocaleString('en-IN')}</span>
          <span className="sl-hero-price-period">/month</span>
        </div>
      </section>

      {/* ══ STATS BAR ══ */}
      <div className="sl-stats-bar">
        {[
          { num: '500', suffix: '+', label: 'Happy Clients' },
          { num: '5',   suffix: '+', label: 'Years Experience' },
          { num: '98',  suffix: '%', label: 'Client Retention' },
          { num: '7',   suffix: '',  label: 'Days Onboarding' },
        ].map((s, i) => (
          <div key={i} className="sl-stat">
            <span className="sl-stat-num" style={{ color: cat.color }}>
              <Counter target={s.num + s.suffix} suffix={s.suffix} />
            </span>
            <span className="sl-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ══ WHAT YOU GET ══ */}
      <section className="sl-section sl-benefits-section">
        <div className="sl-container">
          <div className="sl-section-header">
            <span className="sl-section-tag" style={{ color: cat.color, background: `${cat.color}15` }}>What You Get</span>
            <h2 className="sl-section-title">Everything included in your plan</h2>
            <p className="sl-section-sub">Every service includes dedicated support, monthly reporting and onboarding within 7 days.</p>
          </div>
          <div className="sl-benefits-grid">
            {benefits.map((b, i) => (
              <BenefitCard key={i} b={b} index={i} color={cat.color} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW WE WORK — journey ══ */}
      <section className="sl-section sl-journey-section">
        <div className="sl-container">
          <div className="sl-section-header">
            <span className="sl-section-tag" style={{ color: cat.color, background: `${cat.color}15` }}>How We Work</span>
            <h2 className="sl-section-title">Your journey from sign-up to results</h2>
            <p className="sl-section-sub">A clear, structured process — so you always know what happens next.</p>
          </div>
          <div className="sl-journey-track">
            {steps.map((step, i) => (
              <JourneyStep key={i} step={step} index={i} total={steps.length} color={cat.color} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="sl-pricing" className="sl-section sl-pricing-section">
        <div className="sl-container">
          <div className="sl-section-header">
            <span className="sl-section-tag" style={{ color: cat.color, background: `${cat.color}15` }}>Pricing</span>
            <h2 className="sl-section-title">Simple, transparent plans</h2>
            <p className="sl-section-sub">No hidden fees. Cancel anytime. All plans include onboarding & monthly reporting.</p>
          </div>
          <div className="sl-plans-grid">
            {svc.plans.map((plan, i) => (
              <PlanCard key={i} plan={plan} index={i} svcTitle={svc.title} onConsult={openConsult} onBuy={handleBuyNow} canBuy={canBuy} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ BOTTOM CTA ══ */}
      <section className="sl-cta-section">
        <div className="sl-container">
          <div className="sl-cta-box">
            <div className="sl-cta-text">
              <h3>Not sure which plan fits your business?</h3>
              <p>Book a free 30-min strategy call. We'll audit your current setup and recommend the right plan — no commitment, no pressure.</p>
            </div>
            <div className="sl-cta-actions">
              <button className="sl-cta-btn-primary" onClick={() => openConsult(svc.title)}>Book Free Strategy Call →</button>
              <Link to="/services" className="sl-cta-btn-ghost">Browse All Services</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} preSelectedService={preSelectedService} />
      <Chatbot />

      {/* ══ PAY MODAL ══ */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={() => !paying && setPayModal(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: '36px 32px', maxWidth: 440, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', textAlign: 'center' }}>
            {!paying && <button onClick={() => setPayModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 20 }}>✕</button>}
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #00B4CC22, #00CC8822)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00B4CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#111' }}>Confirm Your Order</h2>
            <p style={{ margin: '0 0 24px', color: '#666', fontSize: 14 }}>You're about to activate the following plan</p>
            <div style={{ background: '#f8fffe', border: '1.5px solid #00B4CC33', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: '#111', fontSize: 15 }}>{payModal.service}</span>
                <span style={{ background: '#00B4CC', color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{payModal.planName} Plan</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#555', fontSize: 13 }}>Monthly amount</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: '#00B4CC' }}>₹{payModal.price.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '8px 14px', marginBottom: 24, fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Secure payment via PayU · 256-bit SSL encryption
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setPayModal(null)} disabled={paying} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1.5px solid #ddd', background: '#fff', color: '#555', fontWeight: 600, cursor: paying ? 'not-allowed' : 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={handleProceedToPayment} disabled={paying} style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: paying ? '#99d9e5' : 'linear-gradient(135deg, #00B4CC, #00CC88)', color: '#fff', fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {paying ? (<><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Processing…</>) : (<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Pay ₹{payModal.price.toLocaleString('en-IN')}</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
