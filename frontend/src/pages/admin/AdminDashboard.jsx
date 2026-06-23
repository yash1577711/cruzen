import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../api/axios.js';
import NotificationBell from '../../components/NotificationBell.jsx';

const ADMIN_NAV = [
  { path: '/admin', icon: 'fa-tachometer-alt', label: 'Dashboard' },
  { path: '/admin/leads', icon: 'fa-funnel-dollar', label: 'Leads' },
  { path: '/admin/users', icon: 'fa-users', label: 'Users' },
  { path: '/admin/orders', icon: 'fa-shopping-cart', label: 'Orders' },
  { path: '/admin/tracker', icon: 'fa-tasks', label: 'Service Tracker' },
  { path: '/admin/tickets', icon: 'fa-headset', label: 'Support Tickets' },
  { path: '/admin/requirements', icon: 'fa-clipboard-list', label: 'Requirements' },
  { path: '/admin/services', icon: 'fa-concierge-bell', label: 'Services' },
  { path: '/admin/onboarding', icon: 'fa-rocket', label: 'Onboarding' },
  { path: '/admin/blog', icon: 'fa-newspaper', label: 'Blog' },
  { path: '/admin/email-blast', icon: 'fa-paper-plane', label: 'Email Blast', adminOnly: true },
  { path: '/admin/consultations', icon: 'fa-calendar-check', label: 'Consultations' },
  { path: '/admin/popup', icon: 'fa-bullhorn', label: 'Promo Popup' },
  { path: '/admin/service-images', icon: 'fa-images', label: 'Service Images' },
  { path: '/admin/staff', icon: 'fa-id-badge', label: 'Staff Management', adminOnly: true },
  { path: '/admin/sub-admins', icon: 'fa-user-shield', label: 'Sub-Admins', adminOnly: true },
];

function AdminSidebar({ isOpen, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <aside className={`dash-sidebar${isOpen ? ' open' : ''}`} style={{ background: '#011e38', color: '#fff' }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'block' }}>
          <img src="/assets/cruzen.png" alt="Cruzen Digital" style={{ height: 36, width: 'auto', display: 'block' }} />
        </Link>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Admin Panel</div>
      </div>

      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
            {user?.name?.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user?.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 0' }}>
        {ADMIN_NAV.filter(item => !item.adminOnly || isAdmin).map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', background: active ? 'rgba(0,180,204,0.12)' : 'none', color: active ? '#fff' : 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s', borderLeft: active ? '3px solid var(--secondary-color)' : '3px solid transparent' }}>
              <i className={`fas ${item.icon}`} style={{ width: 18 }}></i> {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 4, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
          <i className="fas fa-globe"></i>View Website
        </Link>
        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.15)', border: 'none', color: '#fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
      <button className="dash-close-btn" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16 }}>
        <i className="fas fa-times" />
      </button>
    </aside>
  );
}

export function AdminLayout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)', display: 'flex' }}>
      {/* Mobile overlay */}
      <div className={`dash-overlay${sidebarOpen ? ' active' : ''}`} onClick={() => setSidebarOpen(false)} />

      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="dash-mobile-topbar">
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 8px' }}>
          <i className="fas fa-bars" />
        </button>
        <img src="/assets/cruzen.png" alt="Cruzen Digital" style={{ height: 26, width: 'auto' }} />
        <NotificationBell color="rgba(255,255,255,0.85)" />
      </div>

      <main className="dash-main">
        <div className="dash-bell-desktop" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ background: '#011e38', borderRadius: 10, padding: '6px 10px' }}>
            <NotificationBell color="#fff" />
          </div>
        </div>
        {(title || subtitle) && (
          <div style={{ marginBottom: 32 }}>
            {title && <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.75rem)', fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 4 }}>{title}</h1>}
            {subtitle && <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => {
      setStats(r.data.stats);
      setActivities(r.data.recentActivities || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: 'fa-users', color: 'var(--secondary-color)', sub: `+${stats.newUsersThisMonth} this month` },
    { label: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, icon: 'fa-rupee-sign', color: '#1dbf73', sub: `${stats.totalOrders} orders` },
    { label: 'Total Leads', value: stats.totalLeads, icon: 'fa-funnel-dollar', color: '#f59e0b', sub: `+${stats.newLeadsThisMonth} this month` },
    { label: 'Active Orders', value: stats.totalOrders, icon: 'fa-shopping-cart', color: '#6366f1', sub: 'Paid & Active' },
  ] : [];

  const activityIcons = {
    page_view: { icon: 'fa-eye', color: '#64748b' }, login: { icon: 'fa-sign-in-alt', color: '#1dbf73' },
    signup: { icon: 'fa-user-plus', color: '#00B4CC' }, payment_success: { icon: 'fa-check-circle', color: '#1dbf73' },
    payment_started: { icon: 'fa-credit-card', color: '#f59e0b' }, consultation_submit: { icon: 'fa-calendar-check', color: '#6366f1' },
    lead_captured: { icon: 'fa-funnel-dollar', color: '#f59e0b' }, service_click: { icon: 'fa-mouse-pointer', color: '#00B4CC' },
    chatbot_message: { icon: 'fa-comments', color: '#6366f1' },
  };

  return (
    <AdminLayout title="Admin Dashboard" subtitle="Real-time overview of your business metrics.">
      {loading ? <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
            {cards.map((c, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>
                    <i className={`fas ${c.icon}`}></i>
                  </div>
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 4 }}>{c.value}</h3>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</p>
                {c.sub && <p style={{ fontSize: '0.75rem', color: c.color, fontWeight: 600, marginTop: 4 }}>{c.sub}</p>}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {/* Lead Sources */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, color: 'var(--dark-blue)' }}>Lead Sources</h3>
                <Link to="/admin/leads" style={{ color: 'var(--secondary-color)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>View All</Link>
              </div>
              {stats?.leadsBySource?.map(source => (
                <div key={source._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--dark-blue)', fontWeight: 600, textTransform: 'capitalize' }}>{source._id?.replace('_', ' ')}</span>
                  <span style={{ background: 'rgba(0,180,204,0.1)', color: 'var(--secondary-color)', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>{source.count}</span>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', maxHeight: 400, overflowY: 'auto' }}>
              <h3 style={{ fontWeight: 700, color: 'var(--dark-blue)', marginBottom: 20 }}>Recent Activity</h3>
              {activities.slice(0, 15).map((a, i) => {
                const meta = activityIcons[a.type] || { icon: 'fa-circle', color: 'var(--text-light)' };
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, fontSize: '0.75rem', flexShrink: 0 }}>
                      <i className={`fas ${meta.icon}`}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dark-blue)' }}>
                        {a.userId?.name || 'Guest'} · <span style={{ textTransform: 'capitalize', color: 'var(--text-light)', fontWeight: 400 }}>{a.type?.replace(/_/g, ' ')}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                        {new Date(a.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
