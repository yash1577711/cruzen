import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const MARKETPLACES = ['Amazon','Flipkart','Meesho','Myntra','Ajio','Shopify','Snapdeal','Etsy','eBay'];


const BADGES = [
  { label: 'Amazon Registered Partner', star: false },
  { label: 'Flipkart Registered Partner', star: false },
  { label: '4.7/5 on Google', star: true },
];

const STATS = [
  { val: '400+', label: 'Brands served' },
  { val: '10M+', label: 'Visitors driven' },
  { val: '10+',  label: 'Awards won' },
  { val: '4.7/5',label: 'Google rating' },
];

export default function WhyChoose() {
  const sectionRef = useRef(null);
  const ranRef = useRef(false);

  useEffect(() => {
    /* marquee */
    const track = document.getElementById('wc-marquee-track');
    if (track && !track.childNodes.length) {
      const list = [...MARKETPLACES, ...MARKETPLACES];
      track.innerHTML = list.map(m =>
        `<span class="wc-marquee-item"><span class="wc-mdot"></span>${m}</span>`
      ).join('');
    }

    if (ranRef.current) return;

    function animateCounters() {
      document.querySelectorAll('.wc-num[data-val]').forEach(el => {
        const raw = el.getAttribute('data-val');
        const match = raw.match(/^(\d+(\.\d+)?)/);
        if (!match) { el.textContent = raw; return; }
        const target = parseFloat(match[1]);
        const decimals = match[2] ? match[2].length - 1 : 0;
        const suffix = raw.slice(match[0].length);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target, duration: 1.1, ease: 'power3.out',
          onUpdate: () => { el.textContent = (decimals ? obj.val.toFixed(decimals) : Math.round(obj.val)) + suffix; },
          onComplete: () => { el.textContent = raw; },
        });
      });
    }

    function runChart() {
      const linePath = document.getElementById('wc-linePath');
      const areaPath = document.getElementById('wc-areaPath');
      const leadDot  = document.getElementById('wc-leadDot');
      const leadGlow = document.getElementById('wc-leadGlow');
      if (!linePath) return;
      const len = linePath.getTotalLength();
      linePath.style.strokeDasharray = len;
      linePath.style.strokeDashoffset = len;
      const milestones = document.querySelectorAll('.wc-milestone-label');
      const progress = { p: 0 };
      const DUR = 2.0;
      gsap.to(progress, {
        p: 1, duration: DUR, ease: 'power2.inOut',
        onUpdate: () => {
          const dist = len * progress.p;
          linePath.style.strokeDashoffset = len - dist;
          const pt = linePath.getPointAtLength(dist);
          leadDot.setAttribute('cx', pt.x);  leadDot.setAttribute('cy', pt.y);
          leadGlow.setAttribute('cx', pt.x); leadGlow.setAttribute('cy', pt.y);
        },
        onComplete: animateCounters,
      });
      gsap.to(areaPath, { opacity: 1, duration: 1.4, delay: .5, ease: 'power2.out' });
      milestones.forEach((m, i) => {
        gsap.to(m, { opacity: 1, y: '-=6', duration: .5, ease: 'back.out(2)', delay: DUR * (0.28 + i * 0.24) });
      });
    }

    function runEntrance() {
      if (ranRef.current) return;
      ranRef.current = true;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.to('.wc-eyebrow',          { opacity: 1, duration: .5 })
        .to('.wc-subhead',           { opacity: 1, duration: .6 }, '-=.25')
        .to('.wc-badges',            { opacity: 1, duration: .6 }, '-=.4')
        .from('.wc-badge',           { y: 10, opacity: 0, duration: .45, stagger: .08 }, '-=.45')
        .to('#wc-chartPanel',        { opacity: 1, y: 0, duration: .6 }, '-=.3')
        .from('#wc-chartPanel',      { y: 24 }, '<')
        .add(runChart,               '-=.1');
    }

    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { runEntrance(); obs.disconnect(); }
    }, { threshold: 0.1 });
    if (sectionRef.current) obs.observe(sectionRef.current);

    return () => obs.disconnect();
  }, []);

  return (
    <section className="wc-why" ref={sectionRef} id="why-us">
      <div className="wc-orb wc-orb-1" />
      <div className="wc-orb wc-orb-2" />

      <div className="container">
        {/* header */}
        <div className="wc-header">
          <span className="wc-eyebrow">Why Cruzen Digital</span>
          <h2 className="wc-headline">
            <span className="wc-line"><span>We don't just market brands.</span></span>
            <span className="wc-line"><span className="wc-accent-text">We grow them.</span></span>
          </h2>
          <p className="wc-subhead">
            A registered Amazon &amp; Flipkart partner trusted by <strong>400+ brands</strong> to turn marketplace traffic into real, repeatable revenue.
          </p>
        </div>

        {/* badges */}
        <div className="wc-badges">
          {BADGES.map(b => (
            <span key={b.label} className={`wc-badge${b.star ? ' wc-badge-star' : ''}`}>
              {b.star ? (
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9-5-4.9 6.9-1 3.1-6.3Z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              )}
              {b.label}
            </span>
          ))}
        </div>

        {/* growth chart */}
        <div className="wc-chart-panel" id="wc-chartPanel">
          <div className="wc-chart-top">
            <div>
              <div className="wc-chart-eyebrow">Average client trajectory</div>
              <h3 className="wc-chart-title">From listing day one to <span className="wc-big">30x</span> sales</h3>
            </div>
          </div>
          <div className="wc-chart-svg-wrap">
            <svg viewBox="0 0 920 320" id="wc-growthSvg">
              <defs>
                <linearGradient id="wc-lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0C9CB0"/>
                  <stop offset="100%" stopColor="#15C2DA"/>
                </linearGradient>
                <linearGradient id="wc-areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#15C2DA" stopOpacity="0.22"/>
                  <stop offset="100%" stopColor="#15C2DA" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <line x1="40" y1="290" x2="900" y2="290" stroke="#E6EBEF" strokeWidth="1.5"/>
              <path id="wc-areaPath"
                d="M40,260 C160,250 200,180 300,170 C420,158 460,90 560,70 C680,46 720,40 880,30 L880,290 L40,290 Z"
                fill="url(#wc-areaGrad)" opacity="0"/>
              <path id="wc-linePath"
                d="M40,260 C160,250 200,180 300,170 C420,158 460,90 560,70 C680,46 720,40 880,30"
                fill="none" stroke="url(#wc-lineGrad)" strokeWidth="4" strokeLinecap="round"/>
              <circle id="wc-leadDot"  cx="40" cy="260" r="6"  fill="#15C2DA"/>
              <circle id="wc-leadGlow" cx="40" cy="260" r="12" fill="#15C2DA" opacity="0.25"/>
            </svg>
            <div className="wc-milestone-label" style={{left:'17%', top:'78%'}}>Onboarded</div>
            <div className="wc-milestone-label" style={{left:'43%', top:'50%'}}>Listings + SEO live</div>
            <div className="wc-milestone-label" style={{left:'67%', top:'22%'}}>Paid ads scale</div>
            <div className="wc-milestone-label" style={{left:'93%', top:'10%'}}>30x growth</div>
          </div>
          <div className="wc-stats-row">
            {STATS.map(s => (
              <div key={s.label} className="wc-stat">
                <span className="wc-num" data-val={s.val}></span>
                <span className="wc-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* marquee */}
        <div className="wc-marquee-wrap">
          <div className="wc-marquee-track" id="wc-marquee-track" />
        </div>
      </div>
    </section>
  );
}
