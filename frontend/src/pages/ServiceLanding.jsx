import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toast } from 'react-toastify';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ConsultationModal from '../components/ConsultationModal.jsx';
import Chatbot from '../components/Chatbot.jsx';
import api from '../api/axios.js';
import { findService, categoryOf, journeySteps, keyBenefits } from '../data/services.js';

/* ── IntersectionObserver reveal ── */
function useReveal(threshold = 0.15) {
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
  }, []);
  return [ref, visible];
}

/* ── Animated counter (easeOutCubic) ── */
function Counter({ target }) {
  const [val, setVal] = useState('0');
  const [ref, visible] = useReveal(0.5);
  const prefix = /^[^\d]*/.exec(target)?.[0] || '';
  const suffix = /[^\d]*$/.exec(target)?.[0] || '';
  const num = parseInt(target.replace(/\D/g, ''), 10) || 0;
  useEffect(() => {
    if (!visible) return;
    if (!num) { setVal(target); return; }
    const dur = 1600;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(prefix + Math.round(eased * num) + suffix);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible]);
  return <span ref={ref}>{val}</span>;
}

/* ── Benefit card ── */
function BenefitCard({ b, index, color }) {
  const [ref, visible] = useReveal(0.1);
  return (
    <div ref={ref} className={`sl2-benefit${visible ? ' sl2-vis' : ''}`} style={{ '--delay': `${index * 0.08}s`, '--accent': color }}>
      <div className="sl2-benefit-icon" style={{ color, background: `${color}18` }}>
        <i className={b.icon} />
      </div>
      <h4>{b.title}</h4>
      <p>{b.desc}</p>
    </div>
  );
}

/* ── Journey step (alternating left/right timeline) ── */
const TIME_LABELS = ['Day 1', 'Week 1', 'Week 2', 'Month 1', 'Ongoing'];
function JourneyStep({ step, index, color }) {
  const [ref, visible] = useReveal(0.15);
  const isLeft = index % 2 === 0;
  return (
    <div
      ref={ref}
      className={`sl2-step${isLeft ? ' sl2-step-l' : ' sl2-step-r'}${visible ? ' sl2-step-vis' : ''}`}
      style={{ '--delay': `${index * 0.1}s`, '--accent': color }}
    >
      <div className="sl2-step-card">
        <div className="sl2-card-head">
          <div className="sl2-card-icon" style={{ color, background: `${color}18` }}>
            <i className={step.icon} />
          </div>
          <span className="sl2-card-time">{TIME_LABELS[index] || `Step ${index + 1}`}</span>
        </div>
        <h4 className="sl2-card-title">{step.title}</h4>
        <p className="sl2-card-desc">{step.desc}</p>
      </div>
      <div className={`sl2-step-dot${visible ? ' sl2-dot-vis' : ''}`} style={{ '--accent': color }}>
        <span className="sl2-dot-num">{String(index + 1).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

/* ── Plan card ── */
function PlanCard({ plan, index, svcTitle, color, isActive, canBuy, onBuy, onConsult, onHover }) {
  const [ref, visible] = useReveal(0.1);
  return (
    <div
      ref={ref}
      className={`sl2-plan${plan.popular ? ' sl2-plan-pop' : ''}${isActive ? ' sl2-plan-active' : ''}${visible ? ' sl2-plan-vis' : ''}`}
      style={{ '--delay': `${index * 0.1}s`, '--accent': color }}
      onMouseEnter={onHover}
    >
      {plan.popular && <div className="sl2-plan-badge" style={{ background: color }}>Most Popular</div>}
      <div className="sl2-plan-head">
        <div className="sl2-plan-name">{plan.name}</div>
        <div className="sl2-plan-pricing">
          <span className="sl2-plan-price" style={isActive ? { color } : {}}>
            ₹{plan.price.toLocaleString('en-IN')}
          </span>
          <span className="sl2-plan-orig">₹{plan.original.toLocaleString('en-IN')}</span>
        </div>
        <span className="sl2-plan-save" style={{ color, background: `${color}15` }}>
          Save {Math.round((1 - plan.price / plan.original) * 100)}%
        </span>
      </div>
      <ul className="sl2-plan-feats">
        {plan.features.map((f, i) => (
          <li key={i}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            {f}
          </li>
        ))}
      </ul>
      <div className="sl2-plan-btns">
        {canBuy && (
          <button
            className="sl2-btn-buy"
            style={isActive ? { background: color, borderColor: color } : {}}
            onClick={() => onBuy({ label: `${svcTitle} — ${plan.name} Plan`, price: plan.price, service: svcTitle, planName: plan.name })}
          >
            Buy Now — ₹{plan.price.toLocaleString('en-IN')}
          </button>
        )}
        <button className="sl2-btn-consult" onClick={() => onConsult(`${svcTitle} — ${plan.name} Plan`)}>
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const svc = findService(id);
  const cat = svc ? categoryOf(svc) : null;
  const steps = svc ? journeySteps(svc) : [];
  const benefits = svc ? keyBenefits(svc) : [];

  const selectedPlanName = searchParams.get('plan');
  const initialPlan = svc?.plans.find(p => p.name === selectedPlanName) || null;

  const [consultOpen, setConsultOpen] = useState(false);
  const [preSelected, setPreSelected] = useState(null);
  const [activePlan, setActivePlan] = useState(initialPlan || (svc?.plans.find(p => p.popular) || svc?.plans[0]));
  const [payModal, setPayModal] = useState(null);
  const [paying, setPaying] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [lineProgress, setLineProgress] = useState(0);

  const heroRef = useRef(null);
  const journeyRef = useRef(null);
  const rafRef = useRef(null);

  /* page load */
  useEffect(() => {
    window.scrollTo(0, 0);
    setHeroLoaded(false);
    const t = setTimeout(() => setHeroLoaded(true), 80);
    return () => clearTimeout(t);
  }, [id]);

  /* sticky bar visibility */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const obs = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting), { threshold: 0.1 });
    obs.observe(hero);
    return () => obs.disconnect();
  }, []);

  /* journey line scroll fill */
  useEffect(() => {
    const section = journeyRef.current;
    if (!section) return;
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const { top, height } = section.getBoundingClientRect();
        const wh = window.innerHeight;
        const progress = Math.max(0, Math.min(1, (wh * 0.8 - top) / (height - wh * 0.2)));
        setLineProgress(progress);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  /* resume buy intent after login */
  useEffect(() => {
    if (!user) return;
    const intent = localStorage.getItem('cruzen_buy_intent');
    if (!intent) return;
    let plan; try { plan = JSON.parse(intent); } catch { plan = null; }
    localStorage.removeItem('cruzen_buy_intent');
    if (plan) setPayModal(plan);
  }, [user]);

  if (!svc) return (
    <>
      <Header />
      <div style={{ padding: '120px 24px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 16 }}>Service not found</h2>
        <Link to="/services" className="btn btn-primary">Browse All Services</Link>
      </div>
      <Footer />
    </>
  );

  const canBuy = !user || user.role === 'user';
  const openConsult = (s = null) => { setPreSelected(s); setConsultOpen(true); };
  const lowestPrice = Math.min(...svc.plans.map(p => p.price));

  const handleBuyNow = (plan) => {
    if (!user) {
      localStorage.setItem('cruzen_buy_intent', JSON.stringify(plan));
      navigate(`/login?redirect=/services/${id}${selectedPlanName ? `?plan=${selectedPlanName}` : ''}`);
      return;
    }
    if (!canBuy) { toast.info('Service purchases are available for clients only.', { toastId: 'staff-buy' }); return; }
    setPayModal(plan);
  };

  const submitPayU = (url, params) => {
    const form = document.createElement('form');
    form.method = 'POST'; form.action = url;
    Object.entries(params).forEach(([k, v]) => {
      const inp = document.createElement('input');
      inp.type = 'hidden'; inp.name = k; inp.value = String(v ?? '');
      form.appendChild(inp);
    });
    document.body.appendChild(form); form.submit();
  };

  const handlePay = async () => {
    if (!payModal || paying) return;
    setPaying(true);
    try {
      const { data: { order, razorpayOrderId, testMode: rzpTest } } = await api.post('/orders/create', { serviceName: payModal.service, planName: payModal.planName, amount: payModal.price });
      try {
        const { data: { payuUrl, params, testMode: payuTest } } = await api.post('/orders/payu/init', { orderId: order._id });
        if (!payuTest) { setPayModal(null); submitPayU(payuUrl, params); return; }
      } catch (e) { console.warn('PayU fallback:', e.message); }
      await api.post('/orders/verify', { razorpayOrderId, razorpayPaymentId: `demo_${Date.now()}`, razorpaySignature: `demo_${Date.now()}`, orderId: order._id, testMode: rzpTest !== false });
      setPayModal(null);
      toast.success('Payment confirmed! Your order is now active.', { toastId: 'pay-ok' });
      navigate('/dashboard?tab=tracker');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.', { toastId: 'pay-err' });
    } finally { setPaying(false); }
  };

  const displayPlan = activePlan || svc.plans[0];

  return (
    <>
      <Header openConsultation={() => openConsult()} />

      {/* ══════ HERO ══════ */}
      <section ref={heroRef} className="sl2-hero">
        <div className="sl2-hero-bg" style={{ backgroundImage: `url(${svc.image})` }} />
        <div className="sl2-hero-overlay" style={{ '--accent': cat.color }} />

        {/* floating rings */}
        <div className="sl2-rings" aria-hidden="true">
          <div className="sl2-ring sl2-ring-1" style={{ '--c': cat.color }} />
          <div className="sl2-ring sl2-ring-2" style={{ '--c': cat.color }} />
          <div className="sl2-ring sl2-ring-3" style={{ '--c': cat.color }} />
        </div>

        <div className={`sl2-hero-inner${heroLoaded ? ' sl2-loaded' : ''}`}>

          {/* LEFT */}
          <div className="sl2-hero-left">
            <nav className="sl2-crumb">
              <Link to="/">Home</Link>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              <Link to="/services">Services</Link>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              <span style={{ color: cat.color }}>{cat.label}</span>
            </nav>

            <div className="sl2-hero-tag" style={{ background: `${cat.color}22`, color: cat.color, borderColor: `${cat.color}45` }}>
              <span className="sl2-tag-dot" style={{ background: cat.color }} />
              {svc.tag}
            </div>

            <h1 className="sl2-hero-title">{svc.title}</h1>
            <p className="sl2-hero-desc">{svc.desc}</p>

            <div className="sl2-hero-actions">
              <button
                className="sl2-hero-cta"
                style={{ background: cat.color }}
                onClick={() => document.getElementById('sl2-pricing').scrollIntoView({ behavior: 'smooth' })}
              >
                See Pricing &amp; Plans
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              </button>
              <button className="sl2-hero-ghost" onClick={() => openConsult(svc.title)}>
                Free Consultation
              </button>
            </div>

            <div className="sl2-trust-row">
              {['500+ Clients', 'Google Verified', '5-Star Rated', '7-Day Onboard'].map((t, i) => (
                <span key={i} className="sl2-trust-chip">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill={cat.color}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — glassmorphism plan card */}
          <div className="sl2-hero-right">
            <div className="sl2-glass-card" style={{ '--accent': cat.color }}>
              <div className="sl2-gc-header">
                <span className="sl2-gc-label">
                  {initialPlan ? `${initialPlan.name} Plan Selected` : 'Starting From'}
                </span>
                <div className="sl2-gc-price">
                  <span className="sl2-gc-cur">₹</span>
                  <span className="sl2-gc-num">{(displayPlan.price).toLocaleString('en-IN')}</span>
                  <span className="sl2-gc-mo">/mo</span>
                </div>
                <div className="sl2-gc-savings">
                  <span className="sl2-gc-was">₹{displayPlan.original.toLocaleString('en-IN')}</span>
                  <span className="sl2-gc-off">Save {Math.round((1 - displayPlan.price / displayPlan.original) * 100)}%</span>
                </div>
              </div>

              <div className="sl2-gc-features">
                {displayPlan.features.slice(0, 4).map((f, i) => (
                  <div key={i} className="sl2-gc-feat">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    <span>{f}</span>
                  </div>
                ))}
                {displayPlan.features.length > 4 && (
                  <div className="sl2-gc-more">+{displayPlan.features.length - 4} more features included</div>
                )}
              </div>

              <div className="sl2-gc-actions">
                {canBuy && (
                  <button
                    className="sl2-gc-buy"
                    style={{ background: cat.color }}
                    onClick={() => handleBuyNow({ label: `${svc.title} — ${displayPlan.name} Plan`, price: displayPlan.price, service: svc.title, planName: displayPlan.name })}
                  >
                    Buy Now — ₹{displayPlan.price.toLocaleString('en-IN')}
                  </button>
                )}
                <button className="sl2-gc-consult" onClick={() => openConsult(svc.title)}>
                  Get Free Consultation
                </button>
              </div>

              <p className="sl2-gc-note">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Secure · No hidden fees · Cancel anytime
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ══════ STATS BAR ══════ */}
      <div className="sl2-stats-bar" style={{ '--accent': cat.color }}>
        {[
          { val: '500+', label: 'Brands Grown' },
          { val: '5+',   label: 'Years Experience' },
          { val: '98%',  label: 'Retention Rate' },
          { val: '7',    label: 'Days to Onboard' },
        ].map((s, i) => (
          <div key={i} className="sl2-stat">
            <span className="sl2-stat-num" style={{ color: cat.color }}><Counter target={s.val} /></span>
            <span className="sl2-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ══════ WHAT'S INCLUDED ══════ */}
      <section className="sl2-section sl2-benefits-section">
        <div className="sl2-container">
          <div className="sl2-section-hd">
            <span className="sl2-sec-tag" style={{ color: cat.color, background: `${cat.color}12`, borderColor: `${cat.color}35` }}>What's Included</span>
            <h2 className="sl2-sec-title">Everything in your plan</h2>
            <p className="sl2-sec-sub">Every service includes dedicated support, a monthly performance report, and onboarding within 7 days — guaranteed.</p>
          </div>
          <div className="sl2-benefits-grid">
            {benefits.map((b, i) => <BenefitCard key={i} b={b} index={i} color={cat.color} />)}
          </div>
        </div>
      </section>

      {/* ══════ HOW WE WORK ══════ */}
      <section ref={journeyRef} className="sl2-section sl2-journey-section">
        <div className="sl2-container">
          <div className="sl2-section-hd">
            <span className="sl2-sec-tag" style={{ color: cat.color, background: `${cat.color}12`, borderColor: `${cat.color}35` }}>Our Process</span>
            <h2 className="sl2-sec-title">
              Your journey from day one<br />
              <em style={{ fontStyle: 'normal', color: cat.color }}>to real results</em>
            </h2>
            <p className="sl2-sec-sub">A transparent, step-by-step process — so you always know exactly what happens next and when to expect it.</p>
          </div>

          <div className="sl2-journey-wrap" style={{ '--accent': cat.color }}>
            {/* animated fill line */}
            <div className="sl2-jline">
              <div className="sl2-jline-fill" style={{ height: `${lineProgress * 100}%`, background: `linear-gradient(to bottom, ${cat.color}, ${cat.color}66)` }} />
            </div>

            {steps.map((step, i) => (
              <JourneyStep key={i} step={step} index={i} color={cat.color} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════ RESULTS PROOF ══════ */}
      <div className="sl2-proof-strip">
        <div className="sl2-container sl2-proof-inner">
          <div className="sl2-proof-text">
            <h3>Real results. <em style={{ fontStyle: 'normal', color: cat.color }}>Every month.</em></h3>
            <p>Our clients see measurable growth within the first 90 days — or we keep working until they do.</p>
          </div>
          <div className="sl2-proof-stats">
            {[
              { val: '8x',   label: 'Avg. ROAS' },
              { val: '250+', label: 'Brands Managed' },
              { val: '40%',  label: 'CAC Reduction' },
              { val: '90',   label: 'Days to Results' },
            ].map((s, i) => (
              <div key={i} className="sl2-proof-stat">
                <span className="sl2-proof-num" style={{ color: cat.color }}><Counter target={s.val} /></span>
                <span className="sl2-proof-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════ PRICING ══════ */}
      <section id="sl2-pricing" className="sl2-section sl2-pricing-section">
        <div className="sl2-container">
          <div className="sl2-section-hd">
            <span className="sl2-sec-tag" style={{ color: cat.color, background: `${cat.color}12`, borderColor: `${cat.color}35` }}>Pricing</span>
            <h2 className="sl2-sec-title">Transparent plans. Zero surprises.</h2>
            <p className="sl2-sec-sub">All plans include onboarding, monthly reporting, and direct access to your dedicated account manager.</p>
          </div>
          <div className="sl2-plans-row">
            {svc.plans.map((plan, i) => (
              <PlanCard
                key={i}
                plan={plan}
                index={i}
                svcTitle={svc.title}
                color={cat.color}
                isActive={activePlan?.name === plan.name}
                canBuy={canBuy}
                onBuy={handleBuyNow}
                onConsult={openConsult}
                onHover={() => setActivePlan(plan)}
              />
            ))}
          </div>
          <p className="sl2-pricing-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Monthly retainer. No setup fee. Cancel with 30-day notice.
          </p>
        </div>
      </section>

      {/* ══════ BOTTOM CTA ══════ */}
      <section className="sl2-cta-section" style={{ '--accent': cat.color }}>
        <div className="sl2-cta-glow" style={{ background: `radial-gradient(ellipse 60% 70% at 30% 50%, ${cat.color}20, transparent 70%)` }} />
        <div className="sl2-container sl2-cta-inner">
          <div className="sl2-cta-text">
            <span className="sl2-cta-eyebrow">Still deciding?</span>
            <h3>Let's build your growth plan — for free.</h3>
            <p>30 minutes. No pitch. Just an honest audit of where you are and a clear roadmap for where you could be in 90 days.</p>
          </div>
          <div className="sl2-cta-btns">
            <button className="sl2-cta-primary" style={{ background: cat.color }} onClick={() => openConsult(svc.title)}>
              Book Free Strategy Call →
            </button>
            <Link to="/services" className="sl2-cta-ghost">Browse All Services</Link>
          </div>
        </div>
      </section>

      <Footer />
      <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} preSelectedService={preSelected} />
      <Chatbot />

      {/* ══════ STICKY BAR ══════ */}
      <div className={`sl2-sticky${showSticky ? ' sl2-sticky-show' : ''}`} style={{ '--accent': cat.color }}>
        <div className="sl2-sticky-left">
          <span className="sl2-sticky-name">{svc.title}</span>
          <span className="sl2-sticky-price" style={{ color: cat.color }}>from ₹{lowestPrice.toLocaleString('en-IN')}/mo</span>
        </div>
        <div className="sl2-sticky-right">
          <button className="sl2-sticky-consult" onClick={() => openConsult(svc.title)}>Free Consult</button>
          {canBuy && (
            <button
              className="sl2-sticky-buy"
              style={{ background: cat.color }}
              onClick={() => document.getElementById('sl2-pricing').scrollIntoView({ behavior: 'smooth' })}
            >View Plans →</button>
          )}
        </div>
      </div>

      {/* ══════ PAY MODAL ══════ */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} onClick={() => !paying && setPayModal(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 24, padding: '40px 32px', maxWidth: 420, width: '100%', boxShadow: '0 32px 96px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            {!paying && <button onClick={() => setPayModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 20, lineHeight: 1 }}>✕</button>}
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#0a1432' }}>Confirm Your Order</h2>
            <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: 14 }}>You're about to activate the following plan</p>
            <div style={{ background: '#f8fffe', border: `1.5px solid ${cat.color}30`, borderRadius: 14, padding: '18px 20px', marginBottom: 20, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: '#0a1432', fontSize: 15 }}>{payModal.service}</span>
                <span style={{ background: cat.color, color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{payModal.planName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: 13 }}>Monthly amount</span>
                <span style={{ fontWeight: 900, fontSize: 22, color: cat.color }}>₹{payModal.price.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '8px 14px', marginBottom: 22, fontSize: 12, color: '#166534' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Secure payment via PayU · 256-bit SSL
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setPayModal(null)} disabled={paying} style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, cursor: paying ? 'not-allowed' : 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={handlePay} disabled={paying} style={{ flex: 2, padding: '13px 0', borderRadius: 12, border: 'none', background: paying ? '#ccc' : cat.color, color: '#fff', fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {paying
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Processing…</>
                  : <>Pay ₹{payModal.price.toLocaleString('en-IN')}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
