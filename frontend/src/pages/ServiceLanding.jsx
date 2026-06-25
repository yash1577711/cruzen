import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toast } from 'react-toastify';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ConsultationModal from '../components/ConsultationModal.jsx';
import Chatbot from '../components/Chatbot.jsx';
import api from '../api/axios.js';
import { findService, categoryOf, journeySteps, keyBenefits } from '../data/services.js';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

/* ── SVG paths (match demo exactly) ── */
const DESKTOP_PATH = `M 500 0 C 800 200, 800 400, 500 500 C 200 700, 200 900, 500 1000 C 800 1200, 800 1400, 500 1500 C 200 1700, 200 1900, 500 2000 L 500 2400`;
const MOBILE_PATH  = `M 60 0 C 60 100, 80 200, 80 307 C 80 470, 40 640, 40 807 C 40 970, 80 1140, 80 1307 C 80 1470, 40 1640, 40 1807 C 40 1950, 60 2100, 60 2257 L 60 2400`;

const STEP_POS = [
  { side: 'right',  top: 250  },
  { side: 'left',   top: 750  },
  { side: 'right',  top: 1250 },
  { side: 'left',   top: 1750 },
  { side: 'center', top: 2200 },
];

/* ── Animated counter ── */
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

function Counter({ target }) {
  const [val, setVal] = useState('0');
  const [ref, visible] = useReveal(0.5);
  const prefix = /^[^\d]*/.exec(target)?.[0] || '';
  const suffix = /[^\d]*$/.exec(target)?.[0] || '';
  const num = parseInt(target.replace(/\D/g, ''), 10) || 0;
  useEffect(() => {
    if (!visible) return;
    if (!num) { setVal(target); return; }
    const dur = 1600, t0 = performance.now();
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

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function ServiceLanding() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const svc      = findService(id);
  const cat      = svc ? categoryOf(svc) : null;
  const steps    = svc ? journeySteps(svc) : [];
  const benefits = svc ? keyBenefits(svc) : [];

  const planParam   = searchParams.get('plan');
  const initialPlan = svc?.plans.find(p => p.name === planParam)
                   || svc?.plans.find(p => p.popular)
                   || svc?.plans[0];

  const [activePlan,  setActivePlan]  = useState(initialPlan);
  const [consultOpen, setConsultOpen] = useState(false);
  const [preSelected, setPreSelected] = useState(null);
  const [payModal,    setPayModal]    = useState(null);
  const [paying,      setPaying]      = useState(false);
  const [showSticky,  setShowSticky]  = useState(false);

  /* refs */
  const heroRef         = useRef(null);
  const mapContainerRef = useRef(null);
  const desktopFillRef  = useRef(null);
  const mobileFillRef   = useRef(null);
  const arrowRef        = useRef(null);
  const stepCardRefs    = useRef([]);

  /* reset on route change */
  useEffect(() => {
    window.scrollTo(0, 0);
    const plan = svc?.plans.find(p => p.name === planParam)
              || svc?.plans.find(p => p.popular)
              || svc?.plans[0];
    setActivePlan(plan);
    stepCardRefs.current = [];
  }, [id]);

  /* sticky bar */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const obs = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting), { threshold: 0.1 });
    obs.observe(hero);
    return () => obs.disconnect();
  }, []);

  /* resume buy intent after login */
  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem('cruzen_buy_intent');
    if (!raw) return;
    let plan; try { plan = JSON.parse(raw); } catch { return; }
    localStorage.removeItem('cruzen_buy_intent');
    if (plan) setPayModal(plan);
  }, [user]);

  /* ── HERO GSAP entrance ── */
  useLayoutEffect(() => {
    if (!svc || !heroRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });
      tl.from('.sld-img-wrap',   { x: -55, opacity: 0, duration: 1.1, ease: 'power3.out' })
        .from('.sld-badge',      { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.65')
        .from('.sld-hero-title', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
        .from('.sld-hero-sub',   { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.6')
        .from('.sld-feat-item',  { y: 20, opacity: 0, duration: 0.5, stagger: 0.09, ease: 'power3.out' }, '-=0.4')
        .from('.sld-plan-box',   { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
        .from('.sld-hero-btns .sld-btn', { y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }, '-=0.4');
    }, heroRef);
    return () => ctx.revert();
  }, [id]);

  /* ── JOURNEY GSAP (SVG path + cards) ── */
  useLayoutEffect(() => {
    if (!svc || !mapContainerRef.current) return;
    const isMobile  = window.innerWidth <= 1024;
    const activePath = isMobile ? mobileFillRef.current : desktopFillRef.current;
    if (!activePath) return;

    const pathLength = activePath.getTotalLength();
    gsap.set(activePath, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
    gsap.set(arrowRef.current, { opacity: 0 });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mapContainerRef.current,
          start: 'top 60%',
          end: 'bottom 80%',
          scrub: 1.5,
        },
      });

      tl.to(activePath, { strokeDashoffset: 0, ease: 'none' }, 0);
      tl.to(arrowRef.current, { opacity: 1, duration: 0.01 }, 0.02);
      tl.to(arrowRef.current, {
        motionPath: {
          path: activePath,
          align: activePath,
          alignOrigin: [0.5, 0.5],
          autoRotate: -90,
        },
        ease: 'none',
      }, 0);

      stepCardRefs.current.forEach(card => {
        if (!card) return;
        gsap.fromTo(card,
          { y: 40, opacity: 0 },
          {
            scrollTrigger: {
              trigger: card,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
            y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
          }
        );
        const dot = card.querySelector('.sld-dot');
        if (dot) {
          gsap.from(dot, {
            scrollTrigger: {
              trigger: card,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
            scale: 0, duration: 0.5, ease: 'back.out(1.7)', delay: 0.2,
          });
        }
      });
    });

    /* Refresh after images shift layout */
    const t = setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => { clearTimeout(t); ctx.revert(); };
  }, [id]);

  /* ── not found ── */
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

  const canBuy     = !user || user.role === 'user';
  const lowestPr   = Math.min(...svc.plans.map(p => p.price));
  const topFeats   = activePlan?.features.slice(0, 4) || [];
  const displayPlan = activePlan || svc.plans[0];

  const openConsult = (s = null) => { setPreSelected(s); setConsultOpen(true); };

  const handleBuyNow = (plan) => {
    if (!plan) return;
    const payload = { label: `${svc.title} — ${plan.name} Plan`, price: plan.price, service: svc.title, planName: plan.name };
    if (!user) {
      localStorage.setItem('cruzen_buy_intent', JSON.stringify(payload));
      navigate(`/login?redirect=/services/${id}`);
      return;
    }
    if (!canBuy) { toast.info('Service purchases are for clients only.', { toastId: 'staff-buy' }); return; }
    setPayModal(payload);
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
      const { data: { order, razorpayOrderId, testMode: rzpTest } } =
        await api.post('/orders/create', { serviceName: payModal.service, planName: payModal.planName, amount: payModal.price });
      try {
        const { data: { payuUrl, params, testMode: payuTest } } =
          await api.post('/orders/payu/init', { orderId: order._id });
        if (!payuTest) { setPayModal(null); submitPayU(payuUrl, params); return; }
      } catch (e) { console.warn('PayU:', e.message); }
      await api.post('/orders/verify', {
        razorpayOrderId, razorpayPaymentId: `demo_${Date.now()}`,
        razorpaySignature: `demo_${Date.now()}`, orderId: order._id, testMode: rzpTest !== false,
      });
      setPayModal(null);
      toast.success('Payment confirmed! Your order is now active.', { toastId: 'pay-ok' });
      navigate('/dashboard?tab=tracker');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.', { toastId: 'pay-err' });
    } finally { setPaying(false); }
  };

  return (
    <>
      <Header openConsultation={() => openConsult()} />

      {/* ══════════════════════════════════════════
          SPLIT HERO
      ══════════════════════════════════════════ */}
      <section className="sld-hero" ref={heroRef}>
        <div className="sld-hero-inner">

          {/* Left — image */}
          <div className="sld-img-side">
            <div className="sld-img-wrap">
              <img src={svc.image} alt={svc.title} className="sld-img" />
              <div className="sld-glow" style={{ background: `radial-gradient(circle, ${cat.color}55 0%, transparent 60%)` }} />
            </div>
          </div>

          {/* Right — content */}
          <div className="sld-content-side">
            <div className="sld-badge" style={{ color: cat.color, background: `${cat.color}15`, borderColor: `${cat.color}30` }}>
              {cat.label}
            </div>

            <h1 className="sld-hero-title">{svc.title}</h1>
            <p className="sld-hero-sub">{svc.desc}</p>

            <ul className="sld-feat-list">
              {topFeats.map((f, i) => (
                <li key={i} className="sld-feat-item">
                  <span className="sld-check" style={{ color: cat.color }}>✔</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* Plan selector */}
            <div className="sld-plan-box">
              <div className="sld-plan-label">Select Plan:</div>
              <div className="sld-plan-tabs">
                {svc.plans.map(plan => (
                  <button
                    key={plan.name}
                    className={`sld-plan-tab${activePlan?.name === plan.name ? ' sld-tab-active' : ''}`}
                    style={activePlan?.name === plan.name
                      ? { borderColor: cat.color, color: cat.color, background: `${cat.color}12` }
                      : {}}
                    onClick={() => setActivePlan(plan)}
                  >
                    {plan.name}
                    {plan.popular && <span className="sld-pop-badge">Popular</span>}
                  </button>
                ))}
              </div>
              <div className="sld-price-row">
                <span className="sld-price" style={{ color: cat.color }}>
                  ₹{displayPlan.price.toLocaleString('en-IN')}
                </span>
                <span className="sld-price-orig">₹{displayPlan.original.toLocaleString('en-IN')}</span>
                <span className="sld-price-save" style={{ color: cat.color, background: `${cat.color}12` }}>
                  Save {Math.round((1 - displayPlan.price / displayPlan.original) * 100)}%
                </span>
              </div>
            </div>

            <div className="sld-hero-btns">
              {canBuy && (
                <button
                  className="sld-btn sld-btn-primary"
                  style={{ background: cat.color }}
                  onClick={() => handleBuyNow(displayPlan)}
                >
                  Buy Now — ₹{displayPlan.price.toLocaleString('en-IN')}
                </button>
              )}
              <button className="sld-btn sld-btn-outline" onClick={() => openConsult(svc.title)}>
                Book Consultation
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="sld-scroll-ind">
          <p>Begin the journey</p>
          <div className="sld-mouse"><div className="sld-wheel" /></div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <div className="sld-stats-bar" style={{ '--accent': cat.color }}>
        {[
          { val: '500+', label: 'Brands Grown' },
          { val: '5+',   label: 'Years Experience' },
          { val: '98%',  label: 'Retention Rate' },
          { val: '7',    label: 'Days to Onboard' },
        ].map((s, i) => (
          <div key={i} className="sld-stat">
            <span className="sld-stat-num" style={{ color: cat.color }}><Counter target={s.val} /></span>
            <span className="sld-stat-lbl">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          GSAP JOURNEY MAP
      ══════════════════════════════════════════ */}
      <section className="sld-journey-section">
        <div className="sld-journey-header">
          <div className="sld-journey-tag" style={{ color: cat.color, background: `${cat.color}15`, borderColor: `${cat.color}30` }}>
            {displayPlan.name} Plan
          </div>
          <h2 className="sld-journey-h2">The {svc.title} Blueprint</h2>
          <p className="sld-journey-sub">Watch how we systemize your growth from start to finish.</p>
        </div>

        <div className="sld-map-container" ref={mapContainerRef}>

          {/* Desktop SVG */}
          <svg className="sld-path-svg sld-desktop-svg" viewBox="0 0 1000 2600" preserveAspectRatio="xMidYMin meet">
            <path className="sld-path-track" d={DESKTOP_PATH} />
            <path
              className="sld-path-fill"
              d={DESKTOP_PATH}
              ref={desktopFillRef}
              style={{ stroke: cat.color, filter: `drop-shadow(0 0 10px ${cat.color}80)` }}
            />
          </svg>

          {/* Mobile SVG */}
          <svg className="sld-path-svg sld-mobile-svg" viewBox="0 0 120 2600" preserveAspectRatio="xMidYMin meet">
            <path className="sld-path-track" d={MOBILE_PATH} />
            <path
              className="sld-path-fill"
              d={MOBILE_PATH}
              ref={mobileFillRef}
              style={{ stroke: cat.color, filter: `drop-shadow(0 0 10px ${cat.color}80)` }}
            />
          </svg>

          {/* Arrowhead */}
          <div
            className="sld-arrow"
            ref={arrowRef}
            style={{ borderTopColor: cat.color, filter: `drop-shadow(0 0 8px ${cat.color}aa)` }}
          />

          {/* Step cards */}
          {steps.map((step, i) => {
            const pos    = STEP_POS[i] || { side: i % 2 === 0 ? 'right' : 'left', top: 250 + i * 500 };
            const isLast = i === steps.length - 1;
            return (
              <div
                key={i}
                ref={el => { stepCardRefs.current[i] = el; }}
                className={`sld-step-card sld-step-${pos.side} sld-step-${i + 1}`}
                style={{ top: pos.top }}
              >
                <div className="sld-dot" style={{ borderColor: cat.color, boxShadow: `0 0 15px ${cat.color}99` }} />
                <div className="sld-step-content">
                  <div className="sld-step-num" style={{ color: cat.color }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="sld-step-title">{step.title}</h3>
                  <p className="sld-step-desc">{step.desc}</p>
                  {isLast && canBuy && (
                    <button
                      className="sld-btn sld-btn-primary sld-complete-btn"
                      style={{ background: cat.color }}
                      onClick={() => handleBuyNow(displayPlan)}
                    >
                      Complete the Journey — Buy Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHAT'S INCLUDED
      ══════════════════════════════════════════ */}
      <section className="sl2-section sl2-benefits-section">
        <div className="sl2-container">
          <div className="sl2-section-hd">
            <span className="sl2-sec-tag" style={{ color: cat.color, background: `${cat.color}12`, borderColor: `${cat.color}35` }}>What's Included</span>
            <h2 className="sl2-sec-title">Everything in your plan</h2>
            <p className="sl2-sec-sub">Every service includes dedicated support, a monthly performance report, and onboarding within 7 days — guaranteed.</p>
          </div>
          <div className="sl2-benefits-grid">
            {benefits.map((b, i) => (
              <BenefitCard key={i} b={b} index={i} color={cat.color} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING PLANS
      ══════════════════════════════════════════ */}
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

      {/* ══════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════ */}
      <section className="sl2-cta-section" style={{ '--accent': cat.color }}>
        <div className="sl2-cta-glow" style={{ background: `radial-gradient(ellipse 60% 70% at 30% 50%, ${cat.color}20, transparent 70%)` }} />
        <div className="sl2-container sl2-cta-inner">
          <div className="sl2-cta-text">
            <span className="sl2-cta-eyebrow">Still deciding?</span>
            <h3>Let's build your growth plan — for free.</h3>
            <p>30 minutes. No pitch. Just an honest audit and a clear roadmap for where you could be in 90 days.</p>
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

      {/* ══════════════════════════════════════════
          STICKY BAR
      ══════════════════════════════════════════ */}
      <div className={`sl2-sticky${showSticky ? ' sl2-sticky-show' : ''}`} style={{ '--accent': cat.color }}>
        <div className="sl2-sticky-left">
          <span className="sl2-sticky-name">{svc.title}</span>
          <span className="sl2-sticky-price" style={{ color: cat.color }}>from ₹{lowestPr.toLocaleString('en-IN')}/mo</span>
        </div>
        <div className="sl2-sticky-right">
          <button className="sl2-sticky-consult" onClick={() => openConsult(svc.title)}>Free Consult</button>
          {canBuy && (
            <button
              className="sl2-sticky-buy"
              style={{ background: cat.color }}
              onClick={() => document.getElementById('sl2-pricing').scrollIntoView({ behavior: 'smooth' })}
            >
              View Plans →
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PAY MODAL
      ══════════════════════════════════════════ */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} onClick={() => !paying && setPayModal(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 24, padding: '40px 32px', maxWidth: 420, width: '100%', boxShadow: '0 32px 96px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            {!paying && <button onClick={() => setPayModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 20, lineHeight: 1 }}>✕</button>}
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
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

/* ── Benefit card (reused from existing) ── */
function BenefitCard({ b, index, color }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
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

/* ── Plan card ── */
function PlanCard({ plan, index, svcTitle, color, isActive, canBuy, onBuy, onConsult, onHover }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
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
