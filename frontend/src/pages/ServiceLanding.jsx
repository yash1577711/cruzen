import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ConsultationModal from '../components/ConsultationModal.jsx';
import Chatbot from '../components/Chatbot.jsx';
import api from '../api/axios.js';
import { findService, categoryOf, journeySteps, keyBenefits, ALL_FLAT, CATEGORIES } from '../data/services.js';
import { getServiceReviews } from '../data/reviews.js';

/* ─── theme tokens ─── */
const T = {
  bg:       '#f8faff',
  surface:  '#ffffff',
  border:   '#e8edf5',
  text:     '#0a0f2e',
  sub:      '#64748b',
  light:    '#94a3b8',
  shadow:   '0 4px 24px rgba(15,30,80,0.08)',
  shadowMd: '0 8px 40px rgba(15,30,80,0.12)',
};

const DURATION_OPTS = [
  { months: 1,  label: '1 Month',   disc: 0  },
  { months: 3,  label: '3 Months',  disc: 5  },
  { months: 6,  label: '6 Months',  disc: 10 },
  { months: 12, label: '12 Months', disc: 20 },
];

const TESTIMONIALS = [
  { name: 'Rahul Gupta',   company: 'RetailKart India',   plan: 'Amazon Standard',  rating: 5, text: 'Cruzen Digital transformed our Amazon presence. Sales grew 3× in 2 months — the best investment we made.' },
  { name: 'Priya Sharma',  company: 'StyleHub Pvt Ltd',   plan: 'SMO Premium',      rating: 5, text: 'The team handles everything from content strategy to campaigns. Truly a one-stop digital solution for brands.' },
  { name: 'Arjun Mehta',   company: 'TechGadgets Online', plan: 'SEO Standard',     rating: 5, text: 'Ranking on page 1 for our main keywords within 3 months. Their transparency and reporting is exceptional.' },
];

function calcTotal(price, months, disc) {
  return Math.round(price * months * (1 - disc / 100));
}

/* ── Scroll Journey (sticky, one step at a time) ── */
function ScrollJourney({ steps, color }) {
  const [active, setActive] = useState(0);
  const [entering, setEntering] = useState(true);
  const wrapperRef = useRef(null);
  const prevActive = useRef(0);

  useEffect(() => {
    function onScroll() {
      const el = wrapperRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const scrolled = -top;
      const available = height - window.innerHeight;
      const progress = Math.max(0, Math.min(0.999, scrolled / available));
      const next = Math.min(steps.length - 1, Math.floor(progress * steps.length));
      if (next !== prevActive.current) {
        setEntering(false);
        setTimeout(() => { setActive(next); setEntering(true); prevActive.current = next; }, 180);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [steps.length]);

  const step = steps[active] || steps[0];

  return (
    <div ref={wrapperRef} style={{ position: 'relative', height: `${steps.length * 90}vh` }}>
      <div style={{
        position: 'sticky', top: 72, height: 'calc(100vh - 72px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, #f0fbff 0%, #f8faff 60%, #fff 100%)`,
        overflow: 'hidden',
      }}>
        {/* background accent circle */}
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`,
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          transition: 'opacity 0.4s',
        }} />

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 60, maxWidth: 900, width: '90%', position: 'relative', zIndex: 1 }}>

          {/* Left: step list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8 }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 12px', borderRadius: 10,
                background: i === active ? `${color}12` : 'transparent',
                transition: 'background 0.3s',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: i === active ? color : (i < active ? `${color}30` : T.border),
                  color: i === active ? '#fff' : (i < active ? color : T.light),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, transition: 'all 0.3s',
                }}>
                  {i < active ? '✓' : String(i + 1).padStart(2, '0')}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: i === active ? 700 : 500,
                  color: i === active ? T.text : T.light, transition: 'all 0.3s', lineHeight: 1.3,
                }}>{s.title}</span>
              </div>
            ))}
          </div>

          {/* Right: active step display */}
          <div style={{
            opacity: entering ? 1 : 0,
            transform: entering ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, marginBottom: 28,
              background: `linear-gradient(135deg, ${color}20, ${color}10)`,
              border: `2px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={step.icon} style={{ fontSize: 30, color }} />
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16,
              background: `${color}12`, borderRadius: 20, padding: '4px 14px',
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Step {String(active + 1).padStart(2, '0')} of {steps.length}
              </span>
            </div>

            <h3 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: T.text, margin: '0 0 16px', lineHeight: 1.2 }}>
              {step.title}
            </h3>
            <p style={{ fontSize: 16, color: T.sub, lineHeight: 1.75, margin: 0, maxWidth: 480 }}>
              {step.desc}
            </p>

            {/* progress bar */}
            <div style={{ marginTop: 40, height: 4, background: T.border, borderRadius: 4, maxWidth: 320, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, background: color,
                width: `${((active + 1) / steps.length) * 100}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <p style={{ fontSize: 12, color: T.light, marginTop: 8 }}>
              {active + 1} of {steps.length} steps · scroll to continue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Review Carousel (light theme) ── */
const AV = ['#15D8E1','#6366f1','#f59e0b','#10b981','#ec4899','#8b5cf6','#f97316'];

function ReviewCard({ review, color }) {
  const initials = review.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const av = AV[review.name.length % AV.length];
  return (
    <div style={{
      flex: '0 0 300px', background: T.surface, borderRadius: 16, padding: '20px 22px',
      border: `1px solid ${T.border}`, boxShadow: T.shadow, margin: '0 10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: `${av}18`, color: av, fontWeight: 800, fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{review.name}</div>
          <div style={{ fontSize: 11, color: T.light }}>{review.role}</div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, background: `${color}12`, color,
          padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
        }}>{review.plan}</span>
      </div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
        {[...Array(5)].map((_, i) => (
          <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < review.rating ? '#f59e0b' : '#e2e8f0'}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.65, margin: 0 }}>{review.text}</p>
    </div>
  );
}

function ReviewsCarousel({ reviews, color }) {
  const mid = Math.ceil(reviews.length / 2);
  const row1 = reviews.slice(0, mid);
  const row2 = reviews.slice(mid).length ? reviews.slice(mid) : reviews;
  const pause = (e, s) => e.currentTarget.style.setProperty('--rv-play', s);
  return (
    <section style={{ padding: '80px 0', background: '#f0f9ff', overflow: 'hidden' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '0 24px 48px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', background: `${color}15`, padding: '5px 14px', borderRadius: 20 }}>Client Reviews</span>
        <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 800, color: T.text, margin: '14px 0 10px' }}>Trusted by 500+ growing brands</h2>
        <p style={{ color: T.sub, fontSize: 15 }}>Real results from real businesses across India — verified clients, honest feedback.</p>
      </div>
      <div className="sl2-rv-viewport">
        <div className="sl2-rv-row" onMouseEnter={e => pause(e,'paused')} onMouseLeave={e => pause(e,'running')}>
          <div className="sl2-rv-track sl2-rv-left">
            {[...row1,...row1].map((r,i) => <ReviewCard key={i} review={r} color={color} />)}
          </div>
        </div>
        <div className="sl2-rv-row" style={{ marginTop: 16 }} onMouseEnter={e => pause(e,'paused')} onMouseLeave={e => pause(e,'running')}>
          <div className="sl2-rv-track sl2-rv-right">
            {[...row2,...row2].map((r,i) => <ReviewCard key={i} review={r} color={color} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Recommended services ── */
function RecommendedServices({ currentId, cat, color }) {
  const related = (cat?.services || []).filter(s => s.id !== currentId).slice(0, 3);
  if (!related.length) return null;
  return (
    <section style={{ padding: '80px 24px', background: T.surface }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', background: `${color}15`, padding: '5px 14px', borderRadius: 20 }}>You Might Also Like</span>
          <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, color: T.text, margin: '14px 0 8px' }}>More {cat.label} Services</h2>
          <p style={{ color: T.sub }}>Explore other services tailored to grow your business.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 24 }}>
          {related.map(svc => (
            <Link key={svc.id} to={`/services/${svc.id}`} style={{ textDecoration: 'none', display: 'block', background: T.surface, borderRadius: 18, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: T.shadow, transition: 'box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowMd; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ height: 160, overflow: 'hidden' }}>
                <img src={svc.image} alt={svc.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '18px 20px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`, padding: '3px 10px', borderRadius: 20 }}>{svc.tag}</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '10px 0 6px' }}>{svc.title}</h3>
                <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.55, margin: '0 0 14px' }}>{svc.desc.slice(0, 80)}…</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>From ₹{Math.min(...svc.plans.map(p => p.price)).toLocaleString('en-IN')}/mo</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: 4 }}>View Plans →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ── */
function Testimonials() {
  return (
    <section style={{ padding: '80px 24px', background: T.bg }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#6366f115', padding: '5px 14px', borderRadius: 20 }}>Testimonials</span>
          <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, color: T.text, margin: '14px 0 8px' }}>What our clients say</h2>
          <p style={{ color: T.sub }}>Real feedback from businesses that chose Cruzen Digital.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 24 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: T.surface, borderRadius: 18, padding: '28px 28px 24px', border: `1px solid ${T.border}`, boxShadow: T.shadow, position: 'relative' }}>
              <div style={{ fontSize: 40, color: '#6366f120', fontFamily: 'Georgia,serif', lineHeight: 1, marginBottom: 12 }}>"</div>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.75, margin: '0 0 24px', fontStyle: 'italic' }}>{t.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: `linear-gradient(135deg, #6366f120, #15D8E120)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 800, color: '#6366f1',
                }}>
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: T.light }}>{t.company}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                  {[...Array(t.rating)].map((_, j) => (
                    <svg key={j} width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function ServiceLanding() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const svc     = findService(id);
  const cat     = svc ? categoryOf(svc) : null;
  const steps   = svc ? journeySteps(svc) : [];
  const reviews = cat ? getServiceReviews(cat) : [];

  const defaultPlan = svc?.plans?.find(p => p.popular) || svc?.plans?.[0];
  const [plan,     setPlan]     = useState(defaultPlan);
  const [months,   setMonths]   = useState(1);
  const [consultOpen, setConsultOpen] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [paying,   setPaying]   = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const accent = cat?.color || '#15D8E1';

  useEffect(() => {
    window.scrollTo(0, 0);
    setImgLoaded(false);
    const t = setTimeout(() => setImgLoaded(true), 80);
    return () => clearTimeout(t);
  }, [id]);

  useEffect(() => {
    if (!user) return;
    const intent = localStorage.getItem('cruzen_buy_intent');
    if (!intent) return;
    let p; try { p = JSON.parse(intent); } catch { p = null; }
    localStorage.removeItem('cruzen_buy_intent');
    if (p) setPayModal(p);
  }, [user]);

  if (!svc) {
    return (
      <>
        <Header />
        <div style={{ padding: '140px 24px', textAlign: 'center', background: T.bg }}>
          <h2 style={{ color: T.text }}>Service not found</h2>
          <Link to="/services" style={{ color: accent, marginTop: 20, display: 'inline-block', fontWeight: 600 }}>← Browse All Services</Link>
        </div>
        <Footer />
      </>
    );
  }

  const canBuy = !user || user.role === 'user';
  const durOpt = DURATION_OPTS.find(d => d.months === months) || DURATION_OPTS[0];
  const total  = plan ? calcTotal(plan.price, months, durOpt.disc) : 0;
  const savings = plan ? (plan.price * months - total) : 0;
  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  const handleBuyNow = () => {
    if (!user) {
      localStorage.setItem('cruzen_buy_intent', JSON.stringify({ service: svc.title, planName: plan.name, price: plan.price }));
      navigate(`/login?redirect=/services/${id}`);
      return;
    }
    if (!canBuy) { toast.info('Service purchases are available for clients only.', { toastId: 'staff-buy' }); return; }
    setPayModal({ service: svc.title, planName: plan.name, price: total, label: `${svc.title} — ${plan.name}` });
  };

  const handleAddToCart = () => {
    if (!plan) return;
    addToCart({ serviceId: svc.id, service: svc.title, planName: plan.name, price: plan.price, duration: months, quantity: 1, discountPct: durOpt.disc, totalAmount: total, image: svc.image });
    toast.success(`${svc.title} — ${plan.name} added to cart!`, { toastId: 'cart-add' });
  };

  const submitPayUForm = (url, params) => {
    const f = document.createElement('form');
    f.method = 'POST'; f.action = url;
    Object.entries(params).forEach(([k, v]) => {
      const i = document.createElement('input');
      i.type = 'hidden'; i.name = k; i.value = String(v ?? '');
      f.appendChild(i);
    });
    document.body.appendChild(f); f.submit();
  };

  const handlePay = async () => {
    if (!payModal || paying) return;
    setPaying(true);
    try {
      const r = await api.post('/orders/create', { serviceName: payModal.service, planName: payModal.planName, amount: payModal.price });
      const { order, razorpayOrderId, testMode } = r.data;
      try {
        const pr = await api.post('/orders/payu/init', { orderId: order._id });
        if (!pr.data.testMode) { setPayModal(null); submitPayUForm(pr.data.payuUrl, pr.data.params); return; }
      } catch (e) { console.warn('PayU fallback:', e.message); }
      await api.post('/orders/verify', { razorpayOrderId, razorpayPaymentId: `demo_pay_${Date.now()}`, razorpaySignature: `demo_sig_${Date.now()}`, orderId: order._id, testMode: testMode !== false });
      setPayModal(null);
      toast.success('Payment confirmed! Your order is now active.');
      navigate('/dashboard?tab=tracker');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed.');
    } finally { setPaying(false); }
  };

  return (
    <>
      <Helmet>
        <title>{svc.title} — {cat.label} | Cruzen Digital</title>
        <meta name="description" content={svc.desc} />
        <link rel="canonical" href={`https://cruzendigital.us.cc/services/${id}`} />
      </Helmet>

      <Header openConsultation={() => setConsultOpen(true)} />

      <div style={{ background: T.bg, minHeight: '100vh' }}>

        {/* ══ TOP: image card + buy panel ══ */}
        <section style={{ paddingTop: 80, background: T.surface, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 28px 64px', display: 'grid', gridTemplateColumns: '420px 1fr', gap: 44, alignItems: 'start' }}>

            {/* LEFT — sticky image card */}
            <div style={{ position: 'sticky', top: 88 }}>
              <div style={{ borderRadius: 20, overflow: 'hidden', height: 480, boxShadow: '0 12px 48px rgba(15,30,80,0.14)' }}>
                <img src={svc.image} alt={svc.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.5s' }} />
              </div>
              {/* Trust row */}
              <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                {[['⭐','4.9 Rating'],['✓','500+ Clients'],['📋','Monthly Reports']].map(([icon, label]) => (
                  <span key={label} style={{ fontSize: 11, fontWeight: 600, color: T.sub, background: T.bg, border: `1px solid ${T.border}`, padding: '5px 11px', borderRadius: 20 }}>{icon} {label}</span>
                ))}
              </div>
            </div>

            {/* RIGHT — buy panel */}
            <div>
              {/* Breadcrumb */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.light, marginBottom: 18 }}>
                <Link to="/services" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => e.target.style.color = accent} onMouseLeave={e => e.target.style.color = T.light}>All Services</Link>
                <span>›</span>
                <span style={{ color: accent, fontWeight: 600 }}>{cat.label}</span>
              </div>

              <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 20, background: `${accent}15`, color: accent, marginBottom: 14 }}>{svc.tag}</span>
              <h1 style={{ fontSize: 'clamp(1.5rem,2.6vw,2.1rem)', fontWeight: 800, color: T.text, margin: '0 0 12px', lineHeight: 1.22 }}>{svc.title}</h1>
              <p style={{ fontSize: 14, color: T.sub, margin: '0 0 28px', lineHeight: 1.7, maxWidth: 520 }}>{svc.desc}</p>

              <div style={{ height: 1, background: T.border, margin: '0 0 24px' }} />

              {/* Plan selector */}
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: T.light, marginBottom: 12 }}>Select Plan</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
                {svc.plans.map(p => (
                  <button key={p.name} onClick={() => setPlan(p)}
                    style={{
                      position: 'relative', padding: '14px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                      border: plan?.name === p.name ? `2px solid ${accent}` : `2px solid ${T.border}`,
                      background: plan?.name === p.name ? `${accent}0a` : T.bg,
                      transition: 'all 0.18s', outline: 'none',
                    }}
                    onMouseEnter={e => { if (plan?.name !== p.name) e.currentTarget.style.borderColor = `${accent}60`; }}
                    onMouseLeave={e => { if (plan?.name !== p.name) e.currentTarget.style.borderColor = T.border; }}>
                    {p.popular && <span style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', background: accent, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 9px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>Popular</span>}
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: plan?.name === p.name ? accent : T.text }}>{p.name}</span>
                    <span style={{ display: 'block', fontSize: 11, color: T.light, marginTop: 4 }}>₹{p.price.toLocaleString('en-IN')}/mo</span>
                  </button>
                ))}
              </div>

              {/* Duration selector */}
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: T.light, marginBottom: 12 }}>Duration</p>
              <select value={months} onChange={e => setMonths(Number(e.target.value))} style={{
                width: '100%', padding: '12px 16px', borderRadius: 10, marginBottom: 22,
                border: `1.5px solid ${T.border}`, background: T.bg, color: T.text,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
              }}>
                {DURATION_OPTS.map(d => (
                  <option key={d.months} value={d.months}>{d.label}{d.disc > 0 ? ` — ${d.disc}% off` : ''}</option>
                ))}
              </select>

              {/* Price box */}
              {plan && (
                <div style={{ background: `linear-gradient(135deg,${accent}08,#f0fbff)`, border: `1.5px solid ${accent}25`, borderRadius: 14, padding: '18px 20px', marginBottom: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 30, fontWeight: 900, color: T.text, letterSpacing: '-0.01em' }}>₹{total.toLocaleString('en-IN')}</span>
                    {months > 1 && <span style={{ fontSize: 14, color: T.light, textDecoration: 'line-through' }}>₹{(plan.price * months).toLocaleString('en-IN')}</span>}
                    {savings > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', background: '#10b98115', padding: '3px 10px', borderRadius: 20 }}>Save ₹{savings.toLocaleString('en-IN')}</span>}
                  </div>
                  <p style={{ fontSize: 12, color: T.sub, margin: '6px 0 0' }}>
                    ₹{plan.price.toLocaleString('en-IN')}/mo × {months} month{months > 1 ? 's' : ''}
                    {durOpt.disc > 0 ? ` · ${durOpt.disc}% off applied` : ''}
                    {' '}· GST extra
                  </p>
                </div>
              )}

              {/* Account section */}
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: '13px 16px', marginBottom: 20 }}>
                {user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${accent}20`, color: accent, fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{userInitials}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: T.light }}>{user.email}</div>
                    </div>
                    {!canBuy && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#f59e0b', background: '#f59e0b12', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Staff account</span>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: T.sub }}>Login to purchase</span>
                    <Link to={`/login?redirect=/services/${id}`} style={{ fontSize: 13, fontWeight: 700, color: accent, textDecoration: 'none', padding: '6px 16px', border: `1.5px solid ${accent}40`, borderRadius: 8 }}>Login →</Link>
                  </div>
                )}
              </div>

              {/* ── Primary CTA ── */}
              <button
                onClick={handleBuyNow}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 16px 48px ${accent}55`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 28px ${accent}40`; }}
                style={{
                  width: '100%', padding: '16px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${accent} 0%, #09c2c9 100%)`,
                  color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '0.02em',
                  boxShadow: `0 8px 28px ${accent}40`,
                  transition: 'transform 0.18s, box-shadow 0.18s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginBottom: 12,
                }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Buy Now
              </button>

              {/* ── Secondary buttons ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <button
                  onClick={handleAddToCart}
                  onMouseEnter={e => { e.currentTarget.style.background = `${accent}12`; e.currentTarget.style.borderColor = accent; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${accent}50`; }}
                  style={{
                    padding: '13px 0', borderRadius: 10, cursor: 'pointer',
                    border: `1.5px solid ${accent}50`, background: 'transparent',
                    color: accent, fontWeight: 700, fontSize: 14,
                    transition: 'all 0.18s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  Add to Cart
                </button>
                <button
                  onClick={() => setConsultOpen(true)}
                  onMouseEnter={e => { e.currentTarget.style.background = T.bg; e.currentTarget.style.borderColor = `${T.sub}50`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = T.border; }}
                  style={{
                    padding: '13px 0', borderRadius: 10, cursor: 'pointer',
                    border: `1.5px solid ${T.border}`, background: 'transparent',
                    color: T.sub, fontWeight: 600, fontSize: 13,
                    transition: 'all 0.18s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.49 5.49l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 15.6l.92 1.32z"/></svg>
                  Free Call
                </button>
              </div>

              <div style={{ height: 1, background: T.border, margin: '22px 0' }} />

              {/* Features */}
              {plan?.features?.length > 0 && (
                <>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: T.light, marginBottom: 12 }}>Included in {plan.name}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                        <svg style={{ flexShrink: 0, marginTop: 2 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ══ STICKY SCROLL JOURNEY ══ */}
        <div style={{ background: T.bg }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '80px 24px 0' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase', background: `${accent}15`, padding: '5px 14px', borderRadius: 20 }}>How We Work</span>
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 800, color: T.text, margin: '14px 0 10px' }}>Your journey from sign-up to results</h2>
            <p style={{ color: T.sub, fontSize: 15, marginBottom: 0 }}>Scroll through each step — a clear process so you always know what happens next.</p>
          </div>
          <ScrollJourney steps={steps} color={accent} />
        </div>

        {/* ══ REVIEWS ══ */}
        {reviews.length > 0 && <ReviewsCarousel reviews={reviews} color={accent} />}

        {/* ══ RECOMMENDED SERVICES ══ */}
        <RecommendedServices currentId={id} cat={cat} color={accent} />

        {/* ══ CTA ══ */}
        <section style={{ padding: '80px 24px', background: `linear-gradient(135deg, ${accent}12, #f0f9ff)` }}>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 800, color: T.text, margin: '0 0 14px' }}>Not sure which plan fits?</h2>
            <p style={{ color: T.sub, fontSize: 15, margin: '0 0 32px' }}>Book a free 30-min strategy call. We'll audit your current setup and recommend the right plan — no commitment, no pressure.</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setConsultOpen(true)} style={{ padding: '14px 32px', borderRadius: 50, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${accent},#0cb5bc)`, color: '#fff', fontWeight: 800, fontSize: 15 }}>
                Book Free Strategy Call →
              </button>
              <Link to="/services" style={{ padding: '14px 32px', borderRadius: 50, border: `2px solid ${accent}40`, color: accent, fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}>
                Browse All Services
              </Link>
            </div>
          </div>
        </section>

      </div>

      <Footer />
      <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} />
      <Chatbot />

      {/* ══ PAY MODAL ══ */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,46,0.5)', backdropFilter: 'blur(6px)' }} onClick={() => !paying && setPayModal(null)} />
          <div style={{ position: 'relative', background: T.surface, borderRadius: 20, padding: '36px 32px', maxWidth: 440, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            {!paying && <button onClick={() => setPayModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: T.light, fontSize: 20 }}>✕</button>}
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: T.text }}>Confirm Your Order</h2>
            <p style={{ margin: '0 0 20px', color: T.sub, fontSize: 13 }}>You're activating the following plan</p>
            <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{payModal.service}</span>
                <span style={{ background: accent, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{payModal.planName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: T.sub, fontSize: 12 }}>{months} month{months > 1 ? 's' : ''}</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: accent }}>₹{payModal.price.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '8px 12px', marginBottom: 20, fontSize: 11, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Secure payment via PayU · 256-bit SSL encryption
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPayModal(null)} disabled={paying} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.surface, color: T.sub, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={handlePay} disabled={paying} style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: paying ? `${accent}80` : `linear-gradient(135deg,${accent},#0cb5bc)`, color: '#fff', fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {paying ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Processing…</> : `Pay ₹${payModal.price.toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
