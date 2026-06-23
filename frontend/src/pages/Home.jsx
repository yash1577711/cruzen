import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Header from '../components/Header.jsx';
import WhyChoose from '../components/WhyChoose.jsx';
import ConsultationModal from '../components/ConsultationModal.jsx';
import PromoPopup from '../components/PromoPopup.jsx';
import ExitIntentPopup from '../components/ExitIntentPopup.jsx';
import LeadCaptureBar from '../components/LeadCaptureBar.jsx';
import Chatbot from '../components/Chatbot.jsx';

const PORTFOLIO_ITEMS = [
  { num:'01', pc:'#667EEA', pc2:'#764BA2', cat:'Social Media', title:'GlowLab — Instagram Campaign', metric:'+340% engagement', stats:[{n:'+340%',l:'Engagement'},{n:'2.8M',l:'Reach'},{n:'8.1x',l:'ROAS'}], tags:['Meta Ads','Instagram','Creative','Analytics'] },
  { num:'02', pc:'#0ABDE3', pc2:'#048A81', cat:'E-Commerce', title:'ThreadHouse — Shopify Build', metric:'₹1Cr Month 1', stats:[{n:'₹1Cr',l:'Month 1 Revenue'},{n:'68%',l:'Repeat Rate'},{n:'4.8★',l:'Customer Rating'}], tags:['Shopify','UX Design','SEO','Email'] },
  { num:'03', pc:'#2980B9', pc2:'#1A5276', cat:'Performance Ads', title:'PaySync — Google Ads Campaign', metric:'5K signups · ₹210 CPA', stats:[{n:'5K',l:'Signups'},{n:'₹210',l:'Cost Per Acq.'},{n:'6.2x',l:'ROAS'}], tags:['Google Ads','Search','Display','Analytics'] },
  { num:'04', pc:'#E67E22', pc2:'#873600', cat:'Brand Identity', title:'NeonTech — Full Rebrand', metric:'Logo + Guidelines + Web', stats:[{n:'100%',l:'Brand Refresh'},{n:'+180%',l:'Brand Recall'},{n:'3wk',l:'Delivery'}], tags:['Logo Design','Brand Guide','Web Design'] },
  { num:'05', pc:'#E74C3C', pc2:'#922B21', cat:'Meta Ads', title:'FreshBite — Meta Campaign', metric:'4.2x ROAS · 120K orders', stats:[{n:'4.2x',l:'ROAS'},{n:'120K',l:'Orders'},{n:'35%',l:'Lower CAC'}], tags:['Facebook Ads','Instagram','Reels','Retargeting'] },
  { num:'06', pc:'#27AE60', pc2:'#145A32', cat:'Automation', title:'UrbanFit — WhatsApp Flow', metric:'40hrs saved/week', stats:[{n:'40hrs',l:'Saved/Week'},{n:'91%',l:'Response Rate'},{n:'3x',l:'Faster Support'}], tags:['WhatsApp API','Automation','CRM','Zapier'] },
  { num:'07', pc:'#8E44AD', pc2:'#5B2C6F', cat:'SEO', title:'SkyDrive — Organic Traffic Growth', metric:'+280% organic growth', stats:[{n:'+280%',l:'Organic Traffic'},{n:'#1',l:'Google Rankings'},{n:'6mo',l:'To Results'}], tags:['Technical SEO','Content','Backlinks'] },
  { num:'08', pc:'#F39C12', pc2:'#7D6608', cat:'Email Marketing', title:'LuxeGold — Email Series', metric:'42% open rate · 9.1% CTR', stats:[{n:'42%',l:'Open Rate'},{n:'9.1%',l:'CTR'},{n:'5.3x',l:'Revenue Lift'}], tags:['Klaviyo','Copywriting','A/B Testing','Flows'] },
];

const FAQ_ITEMS = [
  { q:'What services does your digital marketing company provide?', a:'We offer performance marketing (Meta & Google Ads), SEO, web development, e-commerce growth (Shopify, Amazon, Flipkart), business automation, WhatsApp marketing, and creative content production. Every service is tied to a measurable growth outcome.' },
  { q:'How can digital marketing benefit my business?', a:'Done right, digital marketing puts your brand in front of people who are actively looking for what you sell — at a fraction of traditional ad costs. Each campaign generates data that makes the next one more efficient. The result is compounding growth that gets cheaper per customer over time.' },
  { q:'Can you help with graphics and content creation for my website or social media?', a:'Yes — we have an in-house creative team that produces ad creatives, social media content, landing pages, email templates, and brand assets. All creative work is strategy-first: designed to convert, not just look good.' },
  { q:'How do you measure the success of digital marketing campaigns?', a:'We track platform metrics (ROAS, CPC, CTR, CPM) alongside actual business outcomes — revenue generated, leads acquired, conversion rate, customer acquisition cost. Every client gets a live dashboard and a weekly summary report in plain English.' },
  { q:'How do you handle client data security and privacy?', a:'We prioritise client data security and privacy at every level. This includes encrypted data transfer, role-based access controls, signed NDAs on all engagements, and strict adherence to data protection regulations including India\'s DPDP Act.' },
  { q:'What is the process for getting started with your digital marketing services?', a:'Book a strategy call → we audit your current digital presence and competitors → propose a 90-day growth roadmap with clear KPIs → onboard within 7 days of sign-off. After the first call, you\'ll know within 30 minutes whether we\'re the right fit.' },
  { q:'What sets your marketplace account management services apart from others?', a:'Most agencies manage Amazon or Flipkart accounts in isolation. We connect marketplace performance to your brand\'s overall digital strategy — same creative direction, same audience insights, unified reporting.' },
];

const CREATOR_CARDS = [
  { type:'video', g1:'#7C3AED', g2:'#4C1D95', seed:'lifestyle', label:'Reel', views:'2.4M views', av:'#7C3AED', init:'LT', handle:'@lifestyle.tales', stats:'Lifestyle · 2.3M' },
  { type:'photo', g1:'#DB2777', g2:'#9D174D', seed:'beauty', label:'Post', views:'89K likes', av:'#DB2777', init:'GN', handle:'@glowwithneha', stats:'Beauty · 1.6M' },
  { type:'video', g1:'#2563EB', g2:'#1D4ED8', seed:'gadgets', label:'Short', views:'1.1M views', av:'#2563EB', init:'TA', handle:'@techwithaditya', stats:'Tech · 980K' },
  { type:'photo', g1:'#0891B2', g2:'#0E7490', seed:'mountains', label:'Post', views:'62K likes', av:'#0891B2', init:'WR', handle:'@wanderlust.raj', stats:'Travel · 890K' },
  { type:'video', g1:'#DC2626', g2:'#991B1B', seed:'cooking', label:'Reel', views:'3.2M views', av:'#DC2626', init:'FK', handle:'@foodkarma.india', stats:'Food · 1.8M' },
  { type:'photo', g1:'#059669', g2:'#065F46', seed:'fitness', label:'Post', views:'41K likes', av:'#059669', init:'FA', handle:'@fitlife.arjun', stats:'Fitness · 760K' },
  { type:'video', g1:'#EA580C', g2:'#9A3412', seed:'fashion', label:'Reel', views:'4.1M views', av:'#EA580C', init:'FS', handle:'@fashionbysneha', stats:'Fashion · 2.9M' },
  { type:'photo', g1:'#7C3AED', g2:'#4C1D95', seed:'puppies', label:'Post', views:'35K likes', av:'#7C3AED', init:'PI', handle:'@pawsome.india', stats:'Pets · 450K' },
];

function CreatorCard({ card }) {
  const thumbStyle = { '--g1': card.g1, '--g2': card.g2, '--thumb': `url('https://picsum.photos/seed/${card.seed}/220/300')` };
  return (
    <div className={`creator-card creator-${card.type}`}>
      <div className="creator-thumb" style={thumbStyle}>
        <div className="creator-type">{card.label}</div>
        {card.type === 'video'
          ? <div className="creator-play-btn"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6 4l9 5-9 5V4z" fill="white"/></svg></div>
          : <div className="creator-photo-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="rgba(255,255,255,0.7)"/><path d="M21 15l-5-5L5 21" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
        }
        <div className="creator-views">{card.views}</div>
      </div>
      <div className="creator-meta">
        <div className="creator-av" style={{'--av': card.av}}>{card.init}</div>
        <div><div className="creator-handle">{card.handle}</div><div className="creator-stats">{card.stats}</div></div>
      </div>
    </div>
  );
}

export default function Home() {
  const [consultOpen, setConsultOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const { user } = useAuth();

  const openConsultation = (service = null) => { setPreSelectedService(service); setConsultOpen(true); };

  // Load page CSS and hide body until it's ready (prevents FOUC)
  useEffect(() => {
    if (document.getElementById('new-home-css')) {
      document.body.style.visibility = 'visible';
      document.body.classList.add('loaded');
      return;
    }
    document.body.style.visibility = 'hidden';
    const link = document.createElement('link');
    link.id = 'new-home-css';
    link.rel = 'stylesheet';
    link.href = '/css/style.css';
    const show = () => {
      document.body.style.visibility = 'visible';
      document.body.classList.add('loaded');
    };
    link.onload = show;
    link.onerror = show;
    document.head.appendChild(link);
    return () => {
      const el = document.getElementById('new-home-css');
      if (el) document.head.removeChild(el);
      document.body.classList.remove('loaded');
      document.body.style.visibility = 'visible';
    };
  }, []);

  // Lenis smooth scroll
  useEffect(() => {
    if (typeof window.Lenis === 'undefined') return;
    const lenis = new window.Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smooth: true, smoothTouch: false });
    let rafId;
    function raf(time) { lenis.raf(time); rafId = requestAnimationFrame(raf); }
    rafId = requestAnimationFrame(raf);
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(time => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    }
    return () => { lenis.destroy(); cancelAnimationFrame(rafId); };
  }, []);


  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); observer.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Smooth scroll for anchor links
  const scrollTo = (id, e) => {
    e.preventDefault();
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Header openConsultation={openConsultation} />

      <main>

        {/* ═══ HERO ═══ */}
        <section id="hero" className="hero">
          <div className="container hero-split">

            {/* Left Column */}
            <div className="hero-left">
              <div className="hero-icons" aria-hidden="true">
                {[
                  { delay:'0s',    label:'Meta Ads',   icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" fill="#1877F2"/></svg> },
                  { delay:'0.1s',  label:'Google',     icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> },
                  { delay:'0.2s',  label:'Shopify',    icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15.337 23.979l6.163-1.337-2.242-15.168c-.018-.114-.114-.194-.211-.194s-2.2-.152-2.2-.152-.87-.861-1.015-1.015C15.355 5.517 14.776 2 12.053 2c-.065 0-.13.013-.194.013C11.13 1.223 10.286 1 9.567 1 4.694 1 2.38 6.807 1.673 9.695L.081 10.17 1.208 22.782 15.337 23.98v-.001z" fill="#95BF47"/></svg> },
                  { delay:'0.3s',  label:'WhatsApp',   icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 2C6.48 2 2 6.48 2 12a9.86 9.86 0 001.51 5.26l-.998 3.648 3.741-.982A9.87 9.87 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" fill="#25D366"/></svg> },
                  { delay:'0.4s',  label:'Analytics',  icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="13" width="4" height="9" rx="1" fill="#15D8E1"/><rect x="8" y="8" width="4" height="14" rx="1" fill="#15D8E1" opacity="0.7"/><rect x="14" y="4" width="4" height="18" rx="1" fill="#15D8E1" opacity="0.5"/><rect x="20" y="10" width="2" height="12" rx="1" fill="#15D8E1" opacity="0.3"/></svg> },
                  { delay:'0.5s',  label:'Web Dev',    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M8 9l-3 3 3 3M16 9l3 3-3 3M13 6l-2 12" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                  { delay:'0.6s',  label:'Automation', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="3" fill="#F59E0B"/></svg> },
                ].map(item => (
                  <div key={item.label} className="hero-icon-wrap icon-float" style={{'--delay': item.delay}}>
                    <div className="hero-icon">{item.icon}</div>
                    <span className="icon-label">{item.label}</span>
                  </div>
                ))}
              </div>

              <h1 className="hero-headline fade-up" style={{'--delay':'0.05s'}}>
                Where Brands &amp;<br />
                <span className="headline-pill">Growth</span><br />
                Work Together.
              </h1>

              <p className="hero-subtext fade-up" style={{'--delay':'0.15s'}}>
                Helping brands scale through performance marketing, automation systems, and modern web experiences — all under one roof.
              </p>

              <div className="hero-cta fade-up" style={{'--delay':'0.25s'}}>
                <button className="btn btn-dark btn-lg" onClick={() => openConsultation()}>
                  Book Strategy Call
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <a href="#portfolio" className="btn btn-outline btn-lg" onClick={e => scrollTo('#portfolio', e)}>View Portfolio</a>
              </div>
            </div>

            {/* Right Column — image */}
            <div className="hero-right fade-up" style={{'--delay':'0.35s'}}>
              <div className="hero-img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&q=80"
                  alt="Cruzen Digital team at work"
                  className="hero-img"
                />
              </div>
            </div>

          </div>
        </section>

        {/* ═══ WHY CHOOSE ═══ */}
        <WhyChoose />

        {/* ═══ AI AUDIT PROMO ═══ */}
        <section style={{ background: 'linear-gradient(155deg, #f0fdff 0%, #ffffff 50%, #f0fdf6 100%)', padding: '80px 20px', position: 'relative', overflow: 'hidden', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          {/* Dot grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #00B4CC15 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,180,204,0.07) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,191,115,0.06) 0%, transparent 65%)' }} />
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '56px', alignItems: 'center' }}>
              {/* Left: copy */}
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,180,204,0.1)', border: '1.5px solid rgba(0,180,204,0.25)', borderRadius: 50, padding: '5px 14px', marginBottom: 22, fontSize: '0.72rem', fontWeight: 700, color: '#0891b2', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  <i className="fas fa-robot" style={{ color: '#00B4CC' }} /> New · AI-Powered Analysis
                </div>
                <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: '#1a1a2e', margin: '0 0 16px', lineHeight: 1.15 }}>
                  Where Does Your<br />
                  <span style={{ background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Business Actually Rank?</span>
                </h2>
                <p style={{ color: '#64748b', lineHeight: 1.8, fontSize: '1rem', margin: '0 0 28px', maxWidth: 420 }}>
                  Enter your Instagram, Amazon listing, Flipkart page, or website. Get a detailed AI audit in seconds — <strong style={{ color: '#1a1a2e' }}>your first audit is completely free.</strong>
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link to="/ai-audit" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 28px', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', borderRadius: 50, color: '#fff', fontWeight: 800, textDecoration: 'none', fontSize: '0.95rem', boxShadow: '0 6px 24px rgba(0,180,204,0.3)' }}>
                    <i className="fas fa-search" /> Get Your Free Audit
                  </Link>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.82rem' }}>
                    <i className="fas fa-check-circle" style={{ color: '#1dbf73' }} /> No credit card needed
                  </span>
                </div>
                {/* Trust row */}
                <div style={{ display: 'flex', gap: 20, marginTop: 28, flexWrap: 'wrap' }}>
                  {[{ n: '500+', l: 'Audits done' }, { n: '6', l: 'Platforms' }, { n: '₹99', l: 'Full unlock' }].map((s, i) => (
                    <div key={i}>
                      <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1a1a2e' }}>{s.n}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Right: score card */}
              <div>
                <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 20, padding: '24px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#1a1a2e', fontSize: '0.9rem' }}>Instagram Audit Preview</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>@yourbrand · Just analysed</div>
                    </div>
                    <span style={{ background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '3px 10px', borderRadius: 50, letterSpacing: '0.3px' }}>FREE</span>
                  </div>
                  {[
                    { label: 'Profile & Bio', score: 62, color: '#f59e0b', issues: 3 },
                    { label: 'Content Strategy', score: 55, color: '#ef4444', issues: 4 },
                    { label: 'SEO & Hashtags', score: 48, color: '#ef4444', issues: 2 },
                    { label: 'Engagement & Growth', score: 74, color: '#1dbf73', issues: 2 },
                  ].map((item, i) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                        <span style={{ color: '#374151', fontSize: '0.8rem', fontWeight: 600 }}>{item.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{item.issues} issues</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: item.color }}>{item.score}/100</span>
                        </div>
                      </div>
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${item.score}%`, background: `linear-gradient(90deg,${item.color}80,${item.color})`, borderRadius: 3, transition: 'width 0.6s' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>Overall Score</span>
                    <span style={{ fontWeight: 900, fontSize: '1.5rem', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>59/100</span>
                  </div>
                  <Link to="/ai-audit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: '11px', background: 'rgba(0,180,204,0.06)', border: '1.5px dashed rgba(0,180,204,0.3)', borderRadius: 12, color: '#0891b2', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem' }}>
                    <i className="fas fa-search" /> Run your own free audit →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ INFLUENCER ═══ */}
        <section id="influencer" className="section influencer-section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Influencer Marketing</span>
              <h2 className="section-title">Match Your Brand With<br />The Perfect <em className="text-cyan">Influencer</em></h2>
              <p className="section-sub">Access a curated network of 10,000+ verified creators across every niche and platform. Real audiences. Trackable results.</p>
            </div>
            <div className="aud-brand-content">
              <div className="aud-benefits">
                {[
                  { c:'#6366F1', title:'Verified creators only', desc:'Every creator is vetted for audience authenticity, engagement quality, and brand safety before they enter our network.', icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.6 5.26L18 8.27l-4 3.9.94 5.5L10 15.1l-4.94 2.58L6 12.17 2 8.27l5.4-.98L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                  { c:'#15D8E1', title:'End-to-end campaign management', desc:'From creator briefs to content review to performance reporting — we handle everything so you can focus on the business.', icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 10h16M10 2l8 8-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                  { c:'#10B981', title:'ROI-linked reporting', desc:'Track reach, engagement, link clicks, and attributed conversions in a single dashboard — not vanity metrics in a PDF.', icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 12l5-5 4 4 7-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                ].map(b => (
                  <div key={b.title} className="aud-benefit reveal">
                    <div className="aud-b-icon" style={{'--c': b.c}}>{b.icon}</div>
                    <div><div className="aud-b-title">{b.title}</div><div className="aud-b-desc">{b.desc}</div></div>
                  </div>
                ))}
              </div>
              <div className="plans-row">
                {[
                  { name:'Starter', price:'₹9,999', features:['5 creator collaborations','Campaign strategy','Content brief creation','Basic performance report'], missing:['Dedicated account manager','Priority creator matching'], popular:false },
                  { name:'Growth', price:'₹24,999', features:['15 creator collaborations','Advanced campaign strategy','Content review & approval','Weekly performance reports','Dedicated account manager','Priority creator matching'], missing:[], popular:true },
                  { name:'Scale', price:'₹49,999', features:['Unlimited collaborations','Custom growth strategy','Full content production','Daily performance reports','Senior account manager','Exclusive creator access'], missing:[], popular:false },
                ].map(plan => (
                  <div key={plan.name} className={`plan-card reveal${plan.popular ? ' plan-popular' : ''}`}>
                    {plan.popular && <div className="plan-badge">Most Popular</div>}
                    <div className="plan-name">{plan.name}</div>
                    <div className="plan-price">{plan.price}<span>/mo</span></div>
                    <ul className="plan-features">
                      {plan.features.map(f => <li key={f}><span className="pf-check">✓</span> {f}</li>)}
                      {plan.missing.map(f => <li key={f} className="pf-dim"><span>–</span> {f}</li>)}
                    </ul>
                    <button className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} plan-cta`} onClick={() => openConsultation(plan.name + ' Influencer Plan')}>Get Started</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="creator-carousel-outer">
            <div className="creator-track">
              {[...CREATOR_CARDS, ...CREATOR_CARDS].map((card, i) => <CreatorCard key={i} card={card} />)}
            </div>
          </div>
        </section>

        {/* ═══ PORTFOLIO ═══ */}
        <section id="portfolio" className="section portfolio-section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Creative Work</span>
              <h2 className="section-title">Diverse Portfolio<br /><em className="text-cyan">Showcase</em></h2>
              <p className="section-sub">Campaigns, websites, and brand systems built for brands that wanted more than a service provider.</p>
            </div>
            <div className="pf-grid reveal">
              {PORTFOLIO_ITEMS.slice(0, 3).map((item, idx) => (
                <div key={idx} className="pf-card" style={{'--c1': item.pc, '--c2': item.pc2}}>
                  <div className="pf-card-top">
                    <span className="pf-cat">{item.cat}</span>
                    <span className="pf-num">{item.num}</span>
                  </div>
                  <h3 className="pf-title">{item.title}</h3>
                  <div className="pf-metric">{item.metric}</div>
                  <div className="pf-stats">
                    {item.stats.map(s => (
                      <div key={s.l} className="pf-stat">
                        <span className="pf-stat-n">{s.n}</span>
                        <span className="pf-stat-l">{s.l}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pf-tags">
                    {item.tags.map(t => <span key={t}>{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="pf-view-all reveal">
              <Link to="/portfolio" className="btn btn-outline btn-lg">
                View All Projects
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIALS ═══ */}
        <section id="testimonials" className="section testi-new-section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag testi-tag">Client Stories</span>
              <h2 className="section-title testi-heading">What Our Clients<br /><em className="text-cyan">Are Saying?</em></h2>
            </div>
          </div>
          <div className="testi-carousel-outer">
            <div className="testi-loop-track">
              {[...Array(2)].flatMap(() => [
                { av:'#10B981', init:'PK', name:'Priya Kapoor', role:'COO, PaySync', quote:'"The automation systems they built saved us 40 hours per week. Response time dropped from 4 hours to under 5 minutes. Our repeat rate jumped 22% in the first month."' },
                { av:'#F59E0B', init:'RM', name:'Rahul Mehta', role:'CEO, ThreadHouse', quote:'"We hit ₹1 crore in our very first month after launch. The Shopify store, Meta ads, and WhatsApp flows were all live on day one. That coordination is genuinely rare."' },
                { av:'#EF4444', init:'SK', name:'Sneha Kulkarni', role:'Marketing Head, FreshBite', quote:'"What sets Cruzen apart is the quality of thinking. They don\'t just run ads — they understand the business, the customer, and the market. That depth shows consistently."' },
                { av:'#8B5CF6', init:'MN', name:'Meera Nair', role:'CMO, NeonTech', quote:'"Our brand went from invisible to instantly recognizable. The rebrand, website, and launch campaign were coordinated perfectly. Enquiries went up 3× in the first two weeks."' },
                { av:'#3B82F6', init:'VS', name:'Vikram Singh', role:'Founder, SkyDrive', quote:'"SEO is a long game but Cruzen made it feel fast. #1 rankings for our core keywords in 6 months and a +280% increase in organic traffic compounding every quarter."' },
                { av:'#15D8E1', init:'AS', name:'Anjali Sharma', role:'CEO, UrbanFit', quote:'"The WhatsApp flow they built is our best-performing channel now. 91% response rate, zero human hours for first-contact support. It just works, beautifully."' },
              ]).map((t, i) => (
                <div key={i} className="testi-loop-card">
                  <div className="testi-lc-stars">★★★★★</div>
                  <blockquote className="testi-lc-quote">{t.quote}</blockquote>
                  <div className="testi-lc-author"><div className="testi-lc-av" style={{'--av': t.av}}>{t.init}</div><div><div className="testi-lc-name">{t.name}</div><div className="testi-lc-role">{t.role}</div></div></div>
                </div>
              ))}
            </div>
            <div className="testi-fade-l"></div>
            <div className="testi-fade-r"></div>
          </div>
        </section>

        {/* ═══ NEWS ═══ */}
        <section id="news" className="section news-section">
          <div className="container">
            <div className="news-header reveal">
              <span className="section-tag">Press</span>
              <h2 className="section-title">Cruzen Digital<br /><em className="text-cyan">Published In News</em></h2>
              <p className="section-sub">Cruzen Digital is now also in the news — recognised for performance, innovation, and impact across the Indian digital ecosystem.</p>
            </div>
          </div>
          <div className="news-marquee-outer">
            <div className="news-track" id="newsTrack">
              {[...Array(2)].flatMap(() => [
                { badge: <div className="nl-badge nl-forbes"><span className="nl-f">F</span><span className="nl-brand-text">ORBES</span><span className="nl-country">INDIA</span></div>, headline:'"Hyderabad\'s Cruzen Digital is redefining performance marketing for D2C brands"', date:'March 2026' },
                { badge: <div className="nl-badge nl-yourstory"><span className="nl-ys-mark">YS</span><span className="nl-brand-text">YourStory</span></div>, headline:'"How this agency helped 250+ brands cut CAC while scaling ROAS to 8x"', date:'February 2026' },
                { badge: <div className="nl-badge nl-inc42"><span className="nl-brand-text">Inc</span><span className="nl-42">42</span></div>, headline:'"The automation-first approach that\'s changing how Indian D2C brands grow online"', date:'January 2026' },
                { badge: <div className="nl-badge nl-et"><span className="nl-et-mark">ET</span><span className="nl-brand-text">The Economic Times</span></div>, headline:'"Digital marketing agencies driving India\'s D2C wave — Cruzen Digital in the spotlight"', date:'December 2025' },
                { badge: <div className="nl-badge nl-bs"><span className="nl-bs-mark">BS</span><span className="nl-brand-text">Business Standard</span></div>, headline:'"Performance marketing emerges as the most reliable growth lever for Indian SMEs"', date:'November 2025' },
                { badge: <div className="nl-badge nl-entrepreneur"><span className="nl-e-mark">e</span><span className="nl-brand-text">ntrepreneur</span><span className="nl-country">india</span></div>, headline:'"Cruzen Digital: building brands through data, not guesswork — an inside look"', date:'October 2025' },
              ]).map((item, i) => (
                <div key={i} className="news-card">
                  <div className="news-logo-wrap">{item.badge}</div>
                  <div className="news-headline">{item.headline}</div>
                  <div className="news-date">{item.date}</div>
                </div>
              ))}
            </div>
            <div className="news-fade-l"></div>
            <div className="news-fade-r"></div>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section id="faq" className="section faq-section">
          <div className="container">
            <div className="faq-layout">
              <div className="faq-left">
                <span className="section-tag">Support</span>
                <h2 className="section-title">Frequently Asked<br /><em className="text-cyan">Questions?</em></h2>
                <p className="faq-sub">The most popular questions. If yours isn't here, just <a href="#contact" className="faq-link" onClick={e => scrollTo('#contact', e)}>send us a message</a>.</p>
                <div className="faq-cta-wrap">
                  <button className="btn btn-dark" onClick={() => openConsultation()}>Ask a Question →</button>
                </div>
              </div>
              <div className="faq-right">
                <div className="faq-list">
                  {FAQ_ITEMS.map((item, i) => (
                    <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                      <button className="faq-q" aria-expanded={openFaq === i} onClick={() => setOpenFaq(p => p === i ? null : i)}>
                        <span>{item.q}</span>
                        <div className="faq-icon"><span>{openFaq === i ? '−' : '+'}</span></div>
                      </button>
                      <div className="faq-answer" style={{maxHeight: openFaq === i ? '400px' : '0', overflow:'hidden', transition:'max-height 0.35s ease'}}>
                        <p>{item.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ BRANDS ═══ */}
        <section id="brands" className="brands-bottom-section">
          <div className="container">
            <div className="brands-bottom-header reveal">
              <span className="section-tag">Clients &amp; Partners</span>
              <h2 className="section-title">Cruzen Digital Working With<br /><em className="text-cyan">The Famous Brands</em></h2>
            </div>
          </div>
          <div className="brands-bottom-marquee">
            <div className="brands-bottom-track">
              {[...Array(2)].flatMap(() => ['Nike','Samsung','Nykaa','Swiggy','Boat Lifestyle','Mamaearth','Meesho','Sugar Cosmetics','Lenskart','Urban Company','Puma','Adidas India','H&M India','Flipkart','Wow Skin Science','Zomato']).map((b, i) => (
                <span key={i} className="bb-item">{b}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CONTACT ═══ */}
        <section id="contact" className="section contact-strip">
          <div className="container">
            <div className="contact-strip-inner reveal">
              <div className="cs-left">
                <h2 className="cs-title">Ready to <em className="text-cyan">Scale?</em></h2>
                <p className="cs-sub">Book a free 30-minute strategy call. No hard sell — just an honest look at where you are and where you could be.</p>
              </div>
              <div className="cs-right">
                <button className="btn btn-dark btn-lg" onClick={() => openConsultation()}>
                  Book Strategy Call
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <a href="https://wa.me/919999999999" className="btn btn-outline btn-lg" target="_blank" rel="noopener noreferrer">WhatsApp Us</a>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Floating Support Ticket Button — logged-in users only */}
      {user && (
        <Link to="/dashboard?tab=tickets" title="Raise a Support Ticket"
          style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 999, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', background: 'linear-gradient(135deg,#011e38,#022B50)', border: '1px solid rgba(0,180,204,0.3)', color: '#fff', borderRadius: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <i className="fas fa-ticket-alt" style={{ color: '#00B4CC' }} />
          Support
        </Link>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer id="footer" className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <a href="#hero" className="nav-logo footer-logo" onClick={e => scrollTo('#hero', e)}>
                <svg className="logo-mark" width="36" height="36" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="#15D8E1"/>
                  <path d="M8 10h6l4 6-4 6H8l4-6-4-6z" fill="white"/>
                  <path d="M18 10h6l-4 6 4 6h-6l-4-6 4-6z" fill="white" opacity="0.6"/>
                </svg>
                <span className="logo-text">Cruzen <strong>Digital</strong></span>
              </a>
              <p className="footer-tagline">Scale Brands. Grow Revenue.<br />Build Systems.</p>
              <div className="footer-socials">
                <a href="#" className="social-link" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
                <a href="#" className="social-link" aria-label="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></a>
                <a href="#" className="social-link" aria-label="Twitter"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4l6.5 7L4 20h2l5-5.5L16 20h4l-6.8-7.5L20 4h-2l-4.7 5.2L8 4H4z" fill="currentColor"/></svg></a>
                <a href="https://wa.me/919999999999" className="social-link" aria-label="WhatsApp"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372C7.713 7.89 7 8.61 7 10.072c0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.948-1.42A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></a>
              </div>
            </div>
            <div className="footer-links-group">
              <h4 className="footer-heading">Navigation</h4>
              <ul className="footer-links">
                <li><a href="#hero" className="footer-link" onClick={e => scrollTo('#hero', e)}>Home</a></li>
                <li><a href="#why-us" className="footer-link" onClick={e => scrollTo('#why-us', e)}>Services</a></li>
                <li><a href="#portfolio" className="footer-link" onClick={e => scrollTo('#portfolio', e)}>Portfolio</a></li>
                <li><a href="#faq" className="footer-link" onClick={e => scrollTo('#faq', e)}>About</a></li>
                <li><a href="#contact" className="footer-link" onClick={e => scrollTo('#contact', e)}>Contact</a></li>
                {!user && <li><Link to="/login" className="footer-link">Login</Link></li>}
                {user && <li><Link to="/dashboard" className="footer-link">Dashboard</Link></li>}
              </ul>
            </div>
            <div className="footer-links-group">
              <h4 className="footer-heading">Services</h4>
              <ul className="footer-links">
                {['Digital Marketing','Web Development','E-Commerce Growth','SEO','Automation','Performance Ads'].map(s => (
                  <li key={s}><button className="footer-link" style={{background:'none',border:'none',cursor:'pointer',padding:0,font:'inherit',textAlign:'left'}} onClick={() => openConsultation(s)}>{s}</button></li>
                ))}
              </ul>
            </div>
            <div className="footer-links-group">
              <h4 className="footer-heading">Contact</h4>
              <ul className="footer-links">
                <li><a href="mailto:info@cruzendigital.com" className="footer-link">info@cruzendigital.com</a></li>
                <li><a href="https://wa.me/918527531393" className="footer-link">+91 8527531393</a></li>
                <li><span className="footer-link no-link">A 50 Dashrath Puri Dabri Palam Road Bharti Refrigeration Works 110045.</span></li>
              </ul>
              <button className="btn btn-primary footer-cta" onClick={() => openConsultation()}>Book a Call →</button>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copy">© 2026 Cruzen Digital. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#" className="footer-legal-link">Privacy Policy</a>
              <a href="#" className="footer-legal-link">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} preSelectedService={preSelectedService} />
      <PromoPopup openConsultation={openConsultation} />
      <ExitIntentPopup />
      <LeadCaptureBar />
      <Chatbot />
    </>
  );
}
