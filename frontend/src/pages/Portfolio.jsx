import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import ConsultationModal from '../components/ConsultationModal.jsx';
import LeadPopup from '../components/LeadPopup.jsx';
import ExitIntentPopup from '../components/ExitIntentPopup.jsx';

const PORTFOLIO_POPUP_CONFIG = {
  delay: 12000,
  badge: 'FREE PROPOSAL',
  title: 'Love what we\'ve built? Let\'s do it for you.',
  subtitle: 'Drop your details and we\'ll send a custom proposal for your business within 24 hours — no cost.',
  fields: [
    { name: 'name',  placeholder: 'Your name or brand name' },
    { name: 'phone', placeholder: 'WhatsApp number', type: 'tel' },
  ],
  ctaText: 'Get My Free Proposal →',
  source: 'portfolio_popup',
  storageKey: 'cruzen_portfolio_popup',
};

const ALL_ITEMS = [
  { num:'01', pc:'#667EEA', pc2:'#764BA2', cat:'Social Media',      title:'GlowLab — Instagram Campaign',      metric:'+340% engagement',         stats:[{n:'+340%',l:'Engagement'},{n:'2.8M',l:'Reach'},{n:'8.1x',l:'ROAS'}],          tags:['Meta Ads','Instagram','Creative','Analytics'] },
  { num:'02', pc:'#0ABDE3', pc2:'#048A81', cat:'E-Commerce',        title:'ThreadHouse — Shopify Build',       metric:'₹1Cr Month 1',             stats:[{n:'₹1Cr',l:'Month 1 Revenue'},{n:'68%',l:'Repeat Rate'},{n:'4.8★',l:'Customer Rating'}], tags:['Shopify','UX Design','SEO','Email'] },
  { num:'03', pc:'#2980B9', pc2:'#1A5276', cat:'Performance Ads',   title:'PaySync — Google Ads Campaign',    metric:'5K signups · ₹210 CPA',    stats:[{n:'5K',l:'Signups'},{n:'₹210',l:'Cost Per Acq.'},{n:'6.2x',l:'ROAS'}],     tags:['Google Ads','Search','Display','Analytics'] },
  { num:'04', pc:'#E67E22', pc2:'#873600', cat:'Brand Identity',    title:'NeonTech — Full Rebrand',           metric:'Logo + Guidelines + Web',  stats:[{n:'100%',l:'Brand Refresh'},{n:'+180%',l:'Brand Recall'},{n:'3wk',l:'Delivery'}], tags:['Logo Design','Brand Guide','Web Design'] },
  { num:'05', pc:'#E74C3C', pc2:'#922B21', cat:'Meta Ads',          title:'FreshBite — Meta Campaign',         metric:'4.2x ROAS · 120K orders',  stats:[{n:'4.2x',l:'ROAS'},{n:'120K',l:'Orders'},{n:'35%',l:'Lower CAC'}],      tags:['Facebook Ads','Instagram','Reels','Retargeting'] },
  { num:'06', pc:'#27AE60', pc2:'#145A32', cat:'Automation',        title:'UrbanFit — WhatsApp Flow',          metric:'40hrs saved/week',         stats:[{n:'40hrs',l:'Saved/Week'},{n:'91%',l:'Response Rate'},{n:'3x',l:'Faster Support'}], tags:['WhatsApp API','Automation','CRM','Zapier'] },
  { num:'07', pc:'#8E44AD', pc2:'#5B2C6F', cat:'SEO',               title:'SkyDrive — Organic Traffic Growth', metric:'+280% organic growth',     stats:[{n:'+280%',l:'Organic Traffic'},{n:'#1',l:'Google Rankings'},{n:'6mo',l:'To Results'}], tags:['Technical SEO','Content','Backlinks'] },
  { num:'08', pc:'#F39C12', pc2:'#7D6608', cat:'Email Marketing',   title:'LuxeGold — Email Series',           metric:'42% open rate · 9.1% CTR', stats:[{n:'42%',l:'Open Rate'},{n:'9.1%',l:'CTR'},{n:'5.3x',l:'Revenue Lift'}], tags:['Klaviyo','Copywriting','A/B Testing','Flows'] },
];

const CATS = ['All', ...Array.from(new Set(ALL_ITEMS.map(i => i.cat)))];

export default function Portfolio() {
  const [consultOpen, setConsultOpen] = useState(false);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    window.scrollTo(0, 0);
    const link = document.createElement('link');
    link.id = 'portfolio-page-css';
    link.rel = 'stylesheet';
    link.href = '/css/style.css';
    if (!document.getElementById('portfolio-page-css') && !document.getElementById('new-home-css')) {
      document.head.appendChild(link);
    }
    return () => {
      const el = document.getElementById('portfolio-page-css');
      if (el) document.head.removeChild(el);
    };
  }, []);

  const filtered = filter === 'All' ? ALL_ITEMS : ALL_ITEMS.filter(i => i.cat === filter);

  return (
    <>
      <Header openConsultation={() => setConsultOpen(true)} />
      <main style={{ paddingTop: '100px', minHeight: '100vh', background: '#fff' }}>

        {/* Hero */}
        <div className="pfp-hero">
          <div className="container">
            <Link to="/" className="pfp-back">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back to Home
            </Link>
            <span className="section-tag" style={{marginTop:'16px',display:'inline-block'}}>Creative Work</span>
            <h1 className="pfp-headline">Our Recent<br /><em className="text-cyan">Portfolio</em></h1>
            <p className="pfp-sub">Campaigns, websites, brand systems &amp; automations built for brands that wanted more than a service provider.</p>
            <div className="pfp-stats">
              {[{n:'250+',l:'Projects Delivered'},{n:'8.4x',l:'Avg ROAS'},{n:'98%',l:'Client Satisfaction'},{n:'7+',l:'Industries'}].map(s => (
                <div key={s.l} className="pfp-stat">
                  <span className="pfp-stat-n">{s.n}</span>
                  <span className="pfp-stat-l">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="container">
          <div className="pfp-filters">
            {CATS.map(c => (
              <button key={c} className={`pfp-filter-btn${filter === c ? ' active' : ''}`} onClick={() => setFilter(c)}>
                {c}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="pf-grid pfp-grid">
            {filtered.map((item, idx) => (
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

          {/* CTA */}
          <div className="pfp-cta">
            <h2 className="pfp-cta-title">Want results like these?</h2>
            <p className="pfp-cta-sub">Let's build your next success story together.</p>
            <button className="btn btn-primary btn-lg" onClick={() => setConsultOpen(true)}>
              Book a Free Strategy Call
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </main>

      <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} />
      <LeadPopup config={PORTFOLIO_POPUP_CONFIG} />
      <ExitIntentPopup />
    </>
  );
}
