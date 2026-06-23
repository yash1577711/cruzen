import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  {
    label: 'Our Services', href: '/services', dropdown: [
      { icon: 'fa-store',        label: 'Marketplace Management', href: '/services?tab=marketplace',    desc: 'Amazon, Flipkart, Meesho, Ajio & more' },
      { icon: 'fa-bullhorn',     label: 'Digital Marketing',      href: '/services?tab=digital',        desc: 'SEO, SMO, SMM, Google Ads & YouTube' },
      { icon: 'fa-user-friends', label: 'Influencer Marketing',   href: '/services?tab=influencer',     desc: 'Nano, micro & macro creator campaigns' },
      { icon: 'fa-laptop-code',  label: 'Website Design',         href: '/services?tab=website',        desc: 'Static, E-commerce & Shopify stores' },
      { icon: 'fa-tag',          label: 'Marketplace Branding',   href: '/services?tab=mp-branding',    desc: 'A+ listings, catalogue & EBC content' },
      { icon: 'fa-paint-brush',  label: 'Branding Plans',         href: '/services?tab=branding',       desc: 'Logo, identity & 360° brand systems' },
      { icon: 'fa-chart-line',   label: '360 Marketing Plans',    href: '/services?tab=360',            desc: 'All-in-one growth & marketing packages' },
    ],
  },
  { label: 'AI Audit', href: '/ai-audit', badge: 'Free' },
  { label: 'Our Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

export default function Header({ openConsultation }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, logout, isStaff } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // entrance animation
    const t = setTimeout(() => setMounted(true), 80);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll); };
  }, []);

  const handleLogout = async () => { await logout(); navigate('/'); };
  const isActive = (href) => href === '/' ? location.pathname === '/' : location.pathname.startsWith(href.split('?')[0]);

  return (
    <>
      {/* ── Header entrance bar ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 2000,
        background: 'linear-gradient(90deg, transparent, #15d8e1, #0dbfc8, transparent)',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease 0.3s',
      }} />

      <header className={`header${scrolled ? ' scrolled' : ''}${mounted ? ' header-in' : ''}`}>
        <div className="container header-container">

          {/* ── Logo ── */}
          <Link to="/" className="hdr-logo">
            <img src="/assets/cruzen.png" alt="Cruzen Digital" className="hdr-logo-img" />
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hdr-nav">
            {NAV.map((item) => (
              item.dropdown ? (
                <div key={item.label} className="hdr-dropdown-wrap">
                  <Link to={item.href} className={`hdr-link${isActive(item.href) ? ' hdr-link-active' : ''}`}>
                    {item.label}
                    <i className="fas fa-chevron-down hdr-chevron" />
                    {isActive(item.href) && <span className="hdr-active-dot" />}
                  </Link>
                  <div className="hdr-mega-menu">
                    <div className="hdr-mega-inner">
                      {item.dropdown.map(d => (
                        <Link key={d.href} to={d.href} className="hdr-mega-item">
                          <span className="hdr-mega-icon"><i className={`fas ${d.icon}`} /></span>
                          <span className="hdr-mega-label">{d.label}</span>
                        </Link>
                      ))}
                      <div className="hdr-mega-footer">
                        <Link to="/services" className="hdr-mega-all">
                          View all services <i className="fas fa-arrow-right" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={item.label} to={item.href}
                  className={`hdr-link${isActive(item.href) ? ' hdr-link-active' : ''}`}>
                  {item.label}
                  {item.badge && <span style={{ marginLeft: 5, fontSize: '0.6rem', fontWeight: 800, background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', padding: '1px 6px', borderRadius: 50, textTransform: 'uppercase', verticalAlign: 'middle', letterSpacing: '0.3px' }}>{item.badge}</span>}
                  {isActive(item.href) && <span className="hdr-active-dot" />}
                </Link>
              )
            ))}
          </nav>

          {/* ── Actions ── */}
          <div className="hdr-actions">
            {user ? (
              <div className="hdr-dropdown-wrap">
                <button className="hdr-user-btn">
                  <span className="hdr-avatar">{user.name.charAt(0).toUpperCase()}</span>
                  <span className="hdr-user-name">{user.name.split(' ')[0]}</span>
                  <i className="fas fa-chevron-down hdr-chevron" style={{ fontSize: '0.6rem', opacity: 0.6 }} />
                </button>
                <div className="hdr-mega-menu hdr-user-menu">
                  <div className="hdr-mega-inner">
                    <Link to="/dashboard" className="hdr-mega-item">
                      <span className="hdr-mega-icon" style={{ background: 'rgba(29,191,115,0.12)', color: '#1dbf73' }}><i className="fas fa-tachometer-alt" /></span>
                      <span><span className="hdr-mega-label">Dashboard</span><span className="hdr-mega-desc">View your services & orders</span></span>
                    </Link>
                    {isStaff && (
                      <Link to="/admin" className="hdr-mega-item">
                        <span className="hdr-mega-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}><i className="fas fa-cog" /></span>
                        <span><span className="hdr-mega-label">Admin Panel</span><span className="hdr-mega-desc">Manage users & services</span></span>
                      </Link>
                    )}
                    <button onClick={handleLogout} className="hdr-mega-item hdr-logout-btn">
                      <span className="hdr-mega-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}><i className="fas fa-sign-out-alt" /></span>
                      <span><span className="hdr-mega-label" style={{ color: '#f87171' }}>Logout</span></span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hdr-login-btn">
                <i className="far fa-user-circle" />
                Login
              </Link>
            )}

            <button className="hdr-cta-btn" onClick={openConsultation}>
              <span className="hdr-cta-glow" />
              <span className="hdr-cta-text">
                <i className="fas fa-calendar-check" />
                Get Consultation
              </span>
            </button>
          </div>

          {/* ── Mobile Hamburger ── */}
          <button className="hdr-hamburger" onClick={() => setMobileOpen(true)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <div className={`hdr-drawer-overlay${mobileOpen ? ' active' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`hdr-drawer${mobileOpen ? ' active' : ''}`}>
        <div className="hdr-drawer-top">
          <Link to="/" className="hdr-logo" onClick={() => setMobileOpen(false)}>
            <img src="/assets/cruzen.png" alt="Cruzen Digital" className="hdr-logo-img" />
          </Link>
          <button className="hdr-drawer-close" onClick={() => setMobileOpen(false)}>
            <i className="fas fa-times" />
          </button>
        </div>

        <nav className="hdr-drawer-nav">
          {NAV.map(item => (
            <Link key={item.label} to={item.href}
              className="hdr-drawer-link"
              onClick={() => setMobileOpen(false)}>
              {item.label}
              {item.badge && <span style={{ fontSize: '0.6rem', fontWeight: 800, background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', padding: '1px 7px', borderRadius: 50, textTransform: 'uppercase' }}>{item.badge}</span>}
              <i className="fas fa-arrow-right" style={{ fontSize: '0.7rem', opacity: 0.4 }} />
            </Link>
          ))}
        </nav>

        <div className="hdr-drawer-footer">
          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-outline" style={{ display: 'block', textAlign: 'center', marginBottom: 10 }} onClick={() => setMobileOpen(false)}>My Dashboard</Link>
              <button className="hdr-cta-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setMobileOpen(false); openConsultation(); }}>
                <span className="hdr-cta-glow" /><span className="hdr-cta-text"><i className="fas fa-calendar-check" />Get Consultation</span>
              </button>
              <button onClick={() => { setMobileOpen(false); handleLogout(); }} style={{ marginTop: 10, width: '100%', padding: '10px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, background: 'rgba(239,68,68,0.08)', color: '#f87171', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" style={{ display: 'block', textAlign: 'center', marginBottom: 10 }} onClick={() => setMobileOpen(false)}>Login</Link>
              <button className="hdr-cta-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setMobileOpen(false); openConsultation(); }}>
                <span className="hdr-cta-glow" /><span className="hdr-cta-text"><i className="fas fa-calendar-check" />Get Consultation</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
