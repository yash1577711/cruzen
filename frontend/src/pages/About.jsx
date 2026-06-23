import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ConsultationModal from '../components/ConsultationModal.jsx';
import Chatbot from '../components/Chatbot.jsx';
import LeadPopup from '../components/LeadPopup.jsx';
import ExitIntentPopup from '../components/ExitIntentPopup.jsx';

const ABOUT_POPUP_CONFIG = {
  delay: 10000,
  badge: 'FREE STRATEGY CALL',
  title: 'Ready to take your brand to the next level?',
  subtitle: 'Get a personalised growth strategy from our team — 30 minutes, completely free, zero pressure.',
  fields: [
    { name: 'name',  placeholder: 'Your name or brand name' },
    { name: 'phone', placeholder: 'WhatsApp number', type: 'tel' },
  ],
  ctaText: 'Book My Free Call →',
  source: 'about_popup',
  storageKey: 'cruzen_about_popup',
};

const STATS = [
  { val: '400+', label: 'Brands Served' },
  { val: '8.4×', label: 'Average ROAS' },
  { val: '250+', label: 'Projects Done' },
  { val: '4.7★', label: 'Google Rating' },
];

const PRINCIPLES = [
  {
    title: 'Radical Transparency',
    desc: 'Real dashboards, real numbers. You see every rupee spent and every result earned — no hidden fees, no fluff reporting. Ever.',
  },
  {
    title: 'Speed to Results',
    desc: "From strategy to live campaign without the red tape. We move fast because your growth window doesn't wait for committee approvals.",
  },
  {
    title: 'Ownership Mindset',
    desc: 'We think like co-founders, not contractors. Every decision we make is weighed against your long-term business health, not our monthly retainer.',
  },
  {
    title: 'Full-Stack Execution',
    desc: 'SEO, paid media, design, development, and marketplace management — one team, one strategy, zero handoff gaps.',
  },
];

const SERVICES = [
  {
    name: 'Performance Marketing',
    tag: 'Google · Meta · Programmatic',
    desc: 'ROI-focused paid media campaigns that track every rupee to a measurable outcome. We don\'t run ads — we engineer growth.',
  },
  {
    name: 'Marketplace Management',
    tag: 'Amazon · Flipkart · Meesho',
    desc: 'End-to-end account management — catalogue, A+ content, sponsored ads, brand protection, and competitor strategy.',
  },
  {
    name: 'Brand & Design',
    tag: 'Identity · UI/UX · Creative',
    desc: 'Visual identity, packaging, landing pages, and creatives that make your brand impossible to ignore at first glance.',
  },
  {
    name: 'Automation & CRM',
    tag: 'Flows · WhatsApp · Email',
    desc: 'Smart workflows, drip sequences, and CRM integrations that nurture leads and scale retention without adding headcount.',
  },
];

export default function About() {
  const [consultOpen, setConsultOpen] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.abt-sv').forEach((el, i) => {
            el.style.transitionDelay = `${i * 0.1}s`;
            el.classList.add('abt-sv-in');
          });
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.25 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Header openConsultation={() => setConsultOpen(true)} />

      {/* ── HERO ─────────────────────────────── */}
      <section className="abt-hero">
        <div className="container abt-hero-wrap">

          <div className="abt-hero-left">
            <span className="abt-eyebrow">About Cruzen Digital</span>
            <h1 className="abt-h1">
              The last agency<br />
              your brand will<br />
              ever <em>need.</em>
            </h1>
            <p className="abt-hero-body">
              We're a full-service digital agency from Hyderabad — trusted by 400+ e-commerce brands to scale on Amazon, Flipkart, Google, Meta, and beyond.
            </p>
            <div className="abt-partners">
              <span className="abt-partner-pill">✓ Amazon Registered Partner</span>
              <span className="abt-partner-pill">✓ Flipkart Partner</span>
              <span className="abt-partner-pill">✓ 4.7★ Google</span>
            </div>
            <button className="btn btn-primary abt-hero-btn" onClick={() => setConsultOpen(true)}>
              Work With Us
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>

          <div className="abt-hero-panel" ref={statsRef}>
            {STATS.map((s, i) => (
              <div key={i} className="abt-panel-cell">
                <div className="abt-sv abt-panel-num">{s.val}</div>
                <div className="abt-panel-lbl">{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── STORY ────────────────────────────── */}
      <section className="abt-story">
        <div className="container abt-story-wrap">
          <div className="abt-story-quote">
            <span className="abt-qmark">"</span>
            Most agencies chase visibility.<br />We chase growth.
          </div>
          <div className="abt-story-cols">
            <p>Cruzen Digital started with one observation: brands were spending big on marketing, but the business wasn't actually growing. Agencies filed reports, ran ads, and collected retainers — while the real needle barely moved.</p>
            <p>We built something different. A team that embeds into your business, learns your product and customer, and treats your margin like their own. Today, 400+ brands across India trust us to execute — not just advise.</p>
          </div>
        </div>
      </section>

      {/* ── PRINCIPLES ───────────────────────── */}
      <section className="abt-principles">
        <div className="container">
          <p className="abt-section-eyebrow">What we stand for</p>
          <div className="abt-principles-list">
            {PRINCIPLES.map((p, i) => (
              <div key={i} className="abt-principle-row">
                <span className="abt-pr-num">0{i + 1}</span>
                <h3 className="abt-pr-title">{p.title}</h3>
                <p className="abt-pr-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────── */}
      <section className="abt-services">
        <div className="container">
          <p className="abt-section-eyebrow">What we do</p>
          <div className="abt-services-grid">
            {SERVICES.map((s, i) => (
              <div key={i} className="abt-svc-cell">
                <div className="abt-svc-tag">{s.tag}</div>
                <h3 className="abt-svc-name">{s.name}</h3>
                <p className="abt-svc-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────── */}
      <section className="abt-cta">
        <div className="container abt-cta-wrap">
          <div className="abt-cta-left">
            <span className="abt-cta-eyebrow">Free Strategy Call</span>
            <h2 className="abt-cta-h2">Ready to scale?<br />Let's talk.</h2>
            <p className="abt-cta-body">30 minutes. No pitch, no pressure. Just a real conversation about your brand's growth.</p>
          </div>
          <div className="abt-cta-right">
            <button className="btn abt-cta-btn" onClick={() => setConsultOpen(true)}>
              Book Free Call
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <p className="abt-cta-note">Usually responds within 2 hours on WhatsApp</p>
          </div>
        </div>
      </section>

      <Footer />
      <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} />
      <LeadPopup config={ABOUT_POPUP_CONFIG} />
      <ExitIntentPopup />
      <Chatbot />
    </>
  );
}
