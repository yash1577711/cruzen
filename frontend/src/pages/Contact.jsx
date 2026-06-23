import { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ConsultationModal from '../components/ConsultationModal.jsx';
import Chatbot from '../components/Chatbot.jsx';
import api from '../api/axios.js';

const SERVICES = [
  'Marketplace Management (Amazon / Flipkart)',
  'Digital Marketing & SEO',
  'Influencer Marketing',
  'Website Design & Development',
  'Performance Ads (Meta / Google)',
  'Brand Identity & Design',
  '360° Marketing Plan',
  'Automation & CRM',
  'Other',
];

const INFO_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.35a16 16 0 0 0 6.07 6.07l1.27-.63a2 2 0 0 1 2.11.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    label: 'Phone',
    value: '08062180749',
    link: 'tel:+918062180749',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    label: 'Email',
    value: 'info@cruzendigital.com',
    link: 'mailto:info@cruzendigital.com',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372C7.713 7.89 7 8.61 7 10.072c0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.948-1.42A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
      </svg>
    ),
    label: 'WhatsApp',
    value: 'Chat with us now',
    link: 'https://wa.me/919560310393',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    label: 'Location',
    value: 'A-50 Dashrath Puri, Dabri Palam Road, New Delhi 110045',
    link: null,
  },
];

export default function Contact() {
  const [consultOpen, setConsultOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { setError('Name and phone are required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/leads', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        service: form.service,
        message: form.message,
        source: 'contact_form',
      });
      setDone(true);
    } catch {
      setError('Something went wrong. Please try WhatsApp or email us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header openConsultation={() => setConsultOpen(true)} />

      {/* Hero */}
      <section className="ctc-hero">
        <div className="container">
          <span className="section-subtitle">Get In Touch</span>
          <h1 className="ctc-hero-title">Let's Talk About<br /><em className="text-cyan">Your Growth</em></h1>
          <p className="ctc-hero-sub">Whether you want to scale on Amazon, launch a campaign, or build a brand — we're here. Fill in the form or just WhatsApp us.</p>
        </div>
      </section>

      {/* Main grid */}
      <section className="ctc-main">
        <div className="container ctc-grid">

          {/* Left — form */}
          <div className="ctc-form-wrap">
            {done ? (
              <div className="ctc-success">
                <div className="ctc-success-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <h3>Message Received!</h3>
                <p>Our team will get back to you within <strong>2–4 business hours</strong>. For urgent queries, WhatsApp us directly.</p>
                <a href="https://wa.me/919876543210" className="ctc-wa-btn" target="_blank" rel="noopener noreferrer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372C7.713 7.89 7 8.61 7 10.072c0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.948-1.42A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
                  Open WhatsApp
                </a>
              </div>
            ) : (
              <form className="ctc-form" onSubmit={handleSubmit}>
                <h2 className="ctc-form-title">Send Us a Message</h2>
                <div className="ctc-row">
                  <div className="ctc-field">
                    <label>Full Name *</label>
                    <input placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} required />
                  </div>
                  <div className="ctc-field">
                    <label>Phone / WhatsApp *</label>
                    <input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                  </div>
                </div>
                <div className="ctc-field">
                  <label>Email Address</label>
                  <input type="email" placeholder="you@brand.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="ctc-field">
                  <label>Service You're Interested In</label>
                  <select value={form.service} onChange={e => set('service', e.target.value)}>
                    <option value="">— Select a service —</option>
                    {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="ctc-field">
                  <label>Message</label>
                  <textarea rows={4} placeholder="Tell us about your brand, goals, or any questions you have…" value={form.message} onChange={e => set('message', e.target.value)} />
                </div>
                {error && <div className="ctc-error">{error}</div>}
                <button type="submit" className="ctc-submit" disabled={submitting}>
                  {submitting ? (
                    <><span className="ctc-spinner" /> Sending…</>
                  ) : (
                    <>Send Message <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></>
                  )}
                </button>
                <div className="ctc-alt">
                  Or <button type="button" className="ctc-alt-link" onClick={() => setConsultOpen(true)}>book a free strategy call →</button>
                </div>
              </form>
            )}
          </div>

          {/* Right — info */}
          <div className="ctc-info">
            <div className="ctc-info-cards">
              {INFO_CARDS.map((card, i) => (
                <div key={i} className="ctc-info-card">
                  <div className="ctc-info-icon">{card.icon}</div>
                  <div>
                    <div className="ctc-info-label">{card.label}</div>
                    {card.link ? (
                      <a href={card.link} className="ctc-info-val" target={card.link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{card.value}</a>
                    ) : (
                      <div className="ctc-info-val">{card.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="ctc-hours">
              <h4>Business Hours</h4>
              <div className="ctc-hours-row"><span>Mon – Sat</span><span>9:00 AM – 7:00 PM IST</span></div>
              <div className="ctc-hours-row"><span>Sunday</span><span>Closed</span></div>
              <div className="ctc-response-note">Average response time: <strong>under 2 hours</strong></div>
            </div>

            <div className="ctc-socials">
              <h4>Follow Us</h4>
              <div className="ctc-social-row">
                <a href="https://www.instagram.com/cruzendigital/" target="_blank" rel="noopener noreferrer" className="ctc-social-btn" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
                  Instagram
                </a>
                <a href="https://www.linkedin.com/company/81866978/" target="_blank" rel="noopener noreferrer" className="ctc-social-btn" aria-label="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  LinkedIn
                </a>
                <a href="https://wa.me/919560310393" className="ctc-social-btn ctc-wa" target="_blank" rel="noopener noreferrer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372C7.713 7.89 7 8.61 7 10.072c0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.948-1.42A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="ctc-cta-card">
              <div className="ctc-cta-icon">🚀</div>
              <h4>Prefer a call?</h4>
              <p>Book a free 30-min strategy session — no pitch, just honest advice about your growth.</p>
              <button className="btn btn-primary" onClick={() => setConsultOpen(true)}>
                Book Free Strategy Call →
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} />
      <Chatbot />
    </>
  );
}
