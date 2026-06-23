import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../api/axios.js';
import { getPlanFeatures } from '../../data/planFeatures.js';
import NotificationBell from '../../components/NotificationBell.jsx';
import OnboardingForm from '../../components/OnboardingForm.jsx';

const NAV_ITEMS = [
  { key: 'overview',      icon: 'fa-tachometer-alt', label: 'Overview' },
  { key: 'services',      icon: 'fa-shopping-bag',   label: 'My Services' },
  { key: 'tracker',       icon: 'fa-tasks',           label: 'Service Tracker' },
  { key: 'onboarding',    icon: 'fa-rocket',          label: 'Onboarding' },
  { key: 'requirements',  icon: 'fa-clipboard-list',  label: 'Requirements' },
  { key: 'payments',      icon: 'fa-receipt',         label: 'Payments' },
  { key: 'chat',          icon: 'fa-comments',        label: 'Team Chat' },
  { key: 'tickets',       icon: 'fa-ticket-alt',      label: 'Support' },
  { key: 'profile',       icon: 'fa-user-edit',       label: 'My Profile' },
];

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [trackers, setTrackers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadReq, setUnreadReq] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const socketRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, trackersRes, ticketsRes, reqRes] = await Promise.allSettled([
        api.get('/orders/my'),
        api.get('/tracker/my'),
        api.get('/tickets'),
        api.get('/requirements/my'),
      ]);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data.orders || []);
      if (trackersRes.status === 'fulfilled') setTrackers(trackersRes.value.data.trackers || []);
      if (ticketsRes.status === 'fulfilled') setTickets(ticketsRes.value.data.tickets || []);
      if (reqRes.status === 'fulfilled') {
        const reqs = reqRes.value.data.requirements || [];
        setRequirements(reqs);
        setUnreadReq(reqs.filter(r => !r.isReadByClient && r.raisedByRole === 'team').length);
      }
    } catch (e) { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    // Socket.io
    const token = localStorage.getItem('accessToken');
    if (token) {
      const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;
      socket.on('connect_error', () => {});
      socket.on('new_message', (msg) => {
        if (msg.senderRole !== 'client') setUnreadChat(c => c + 1);
      });
      socket.on('tracker_updated', (data) => {
        setTrackers(prev => prev.map(t =>
          t._id === data.trackerId
            ? { ...t, progressPercent: data.progressPercent, overallStatus: data.overallStatus, updates: data.updates }
            : t
        ));
      });
      // Fallback: re-fetch all trackers on any tracker notification
      socket.on('notification', (notif) => {
        if (notif.type === 'tracker_updated') {
          api.get('/tracker/my').then(r => setTrackers(r.data.trackers || [])).catch(() => {});
        }
      });
    }
    // Handle checkout redirect
    if (searchParams.get('checkout') === '1') {
      const pending = sessionStorage.getItem('pendingPurchase');
      if (pending) { setActiveTab('services'); handlePendingPurchase(JSON.parse(pending)); }
    }
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
    return () => socketRef.current?.disconnect();
  }, []);

  const handlePendingPurchase = async (purchase) => {
    try {
      const { data } = await api.post('/orders/create', { serviceId: purchase.serviceId, planName: purchase.planName });
      if (data.testMode) {
        const confirm = window.confirm(`🧪 Demo Payment Mode\n\nService: ${purchase.serviceTitle}\nPlan: ${purchase.planName}\nAmount: ₹${(data.amount / 100).toLocaleString('en-IN')}\n\nClick OK to simulate a successful payment.`);
        if (confirm) {
          sessionStorage.removeItem('pendingPurchase');
          await api.post('/orders/verify', { razorpayOrderId: data.razorpayOrderId, razorpayPaymentId: `demo_pay_${Date.now()}`, razorpaySignature: 'demo_signature', orderId: data.order._id, testMode: true });
          toast.success('🎉 Payment successful! Service activated.');
          loadData(); setActiveTab('tracker');
        }
        return;
      }
      initRazorpay(data, purchase);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create order.'); }
  };

  const initRazorpay = (orderData, purchase) => {
    const open = () => {
      new window.Razorpay({
        key: orderData.key, amount: orderData.amount, currency: orderData.currency,
        name: 'Cruzen Digital', description: `${purchase.serviceTitle} - ${purchase.planName}`,
        order_id: orderData.razorpayOrderId,
        handler: async (resp) => {
          try {
            await api.post('/orders/verify', { razorpayOrderId: resp.razorpay_order_id, razorpayPaymentId: resp.razorpay_payment_id, razorpaySignature: resp.razorpay_signature, orderId: orderData.order._id });
            toast.success('🎉 Payment successful!'); loadData(); setActiveTab('tracker');
          } catch { toast.error('Verification failed. Contact support.'); }
        },
        prefill: { name: user.name, email: user.email, contact: user.phone || '' },
        theme: { color: '#1dbf73' },
      }).open();
    };
    if (!window.Razorpay) {
      const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = open; document.body.appendChild(s);
    } else open();
  };

  const handleLogout = async () => { await logout(); navigate('/'); };
  const closeSidebar = () => setSidebarOpen(false);
  const navClick = (key) => {
    setActiveTab(key); closeSidebar();
    if (key === 'chat') setUnreadChat(0);
    if (key === 'requirements') setUnreadReq(0);
  };

  const activeOrder = orders.find(o => o.status === 'active');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex' }}>
      {sidebarOpen && <div onClick={closeSidebar} className="dash-overlay active" />}

      {/* ── Sidebar ─────────────────────────────── */}
      <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`}
        style={{ width: 260, background: '#011e38', color: '#fff', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100, overflowY: 'auto' }}>

        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'block' }}>
            <img src="/assets/cruzen.png" alt="Cruzen Digital" style={{ height: 34, width: 'auto', display: 'block' }} />
          </Link>
          <button onClick={closeSidebar} className="dash-close-btn" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.1rem' }}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
              {user?.avatar ? <img src={user.avatar} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="" /> : user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          {activeOrder && (
            <div style={{ marginTop: 12, background: 'rgba(0,180,204,0.12)', borderRadius: 8, padding: '6px 10px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
              <span style={{ color: '#1dbf73' }}>●</span> {activeOrder.planName} Plan active
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map(item => {
            const badge = item.key === 'chat' ? unreadChat : item.key === 'requirements' ? unreadReq : 0;
            return (
              <button key={item.key} onClick={() => navClick(item.key)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px', background: activeTab === item.key ? 'rgba(0,180,204,0.15)' : 'none', border: 'none', color: activeTab === item.key ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, borderLeft: activeTab === item.key ? '3px solid #00B4CC' : '3px solid transparent', fontFamily: 'inherit', transition: 'all 0.15s', position: 'relative' }}>
                <i className={`fas ${item.icon}`} style={{ width: 16, fontSize: '0.85rem' }} />
                {item.label}
                {badge > 0 && <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>{badge}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
            <i className="fas fa-globe" /> Visit Website
          </Link>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.12)', border: 'none', color: '#fca5a5', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit' }}>
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile topbar ─────────────────────── */}
      <div className="dash-mobile-topbar">
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 8px' }}>
          <i className="fas fa-bars" />
        </button>
        <img src="/assets/cruzen.png" alt="Cruzen Digital" style={{ height: 28, width: 'auto' }} />
        <NotificationBell color="rgba(255,255,255,0.85)" socket={socketRef.current} />
      </div>

      {/* ── Main ──────────────────────────────── */}
      <main className="dash-main">
        {/* Bell: desktop only (mobile bell is in topbar) */}
        <div className="dash-bell-desktop" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={{ background: '#011e38', borderRadius: 10, padding: '6px 10px' }}>
            <NotificationBell color="#fff" socket={socketRef.current} />
          </div>
        </div>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <>
            {activeTab === 'overview'     && <Overview user={user} orders={orders} trackers={trackers} tickets={tickets} setActiveTab={navClick} />}
            {activeTab === 'services'     && <MyServices orders={orders} onPurchase={handlePendingPurchase} navigate={navigate} />}
            {activeTab === 'tracker'      && <TrackerSection trackers={trackers} orders={orders} onRefresh={loadData} />}
            {activeTab === 'onboarding'   && <OnboardingSection orders={orders} />}
            {activeTab === 'requirements' && <RequirementsSection orders={orders} requirements={requirements} onRefresh={loadData} user={user} />}
            {activeTab === 'payments'     && <PaymentHistory orders={orders} />}
            {activeTab === 'chat'         && <ChatSection orders={orders} user={user} socket={socketRef.current} />}
            {activeTab === 'tickets'      && <TicketsSection tickets={tickets} orders={orders} onRefresh={loadData} />}
            {activeTab === 'profile'      && <Profile user={user} onRefresh={loadData} />}
          </>
        )}
      </main>
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────
function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: '#64748b', marginTop: 4, fontSize: '0.9rem' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', ...style }}>{children}</div>;
}

function Badge({ status }) {
  const map = {
    active: ['#dcfce7', '#16a34a'], pending: ['#fef9c3', '#b45309'], paid: ['#dcfce7', '#16a34a'],
    completed: ['#dbeafe', '#2563eb'], cancelled: ['#fee2e2', '#dc2626'], refunded: ['#f3f4f6', '#6b7280'],
    'in-progress': ['#dbeafe', '#2563eb'], 'not-started': ['#f1f5f9', '#64748b'],
    review: ['#fdf4ff', '#9333ea'], 'on-hold': ['#fff7ed', '#c2410c'],
    open: ['#fff7ed', '#c2410c'], resolved: ['#dcfce7', '#16a34a'], closed: ['#f1f5f9', '#64748b'],
    'waiting-client': ['#fef9c3', '#b45309'],
  };
  const [bg, color] = map[status] || ['#f1f5f9', '#64748b'];
  return <span style={{ background: bg, color, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 50, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{status?.replace(/-/g, ' ')}</span>;
}

function PlanCountdown({ order }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!order?.endDate) return;
    const tick = () => {
      const diff = new Date(order.endDate) - new Date();
      if (diff <= 0) return setTimeLeft({ expired: true });
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft({ days, hours, mins, isLastDay: days === 0 });
    };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, [order]);

  if (!order?.endDate || !timeLeft) return null;

  const urgent = timeLeft.isLastDay || timeLeft.expired;
  return (
    <div style={{ background: urgent ? '#fff5f5' : '#f0fdf4', border: `1px solid ${urgent ? '#fecaca' : '#bbf7d0'}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: '1.6rem' }}>{timeLeft.expired ? '⚠️' : urgent ? '🔔' : '⏳'}</div>
      <div>
        <div style={{ fontWeight: 700, color: urgent ? '#dc2626' : '#16a34a', fontSize: '0.875rem' }}>
          {timeLeft.expired ? 'Plan Expired — Renew Now' : urgent ? `Last day! Expires in ${timeLeft.hours}h ${timeLeft.mins}m` : `${timeLeft.days} days remaining on ${order.planName} plan`}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
          {order.service?.title} · Ends {new Date(order.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
      {urgent && <Link to="/services" style={{ marginLeft: 'auto', padding: '7px 16px', background: '#ef4444', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Renew</Link>}
    </div>
  );
}

// ─── Overview ────────────────────────────────────────
function Overview({ user, orders, trackers, tickets, setActiveTab }) {
  const activeOrders = orders.filter(o => o.status === 'active');
  const totalSpent = orders.filter(o => ['active', 'completed', 'paid'].includes(o.status)).reduce((s, o) => s + (o.amount || 0), 0);
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const avgProgress = trackers.length ? Math.round(trackers.reduce((s, t) => s + t.progressPercent, 0) / trackers.length) : 0;

  const stats = [
    { label: 'Active Services', value: activeOrders.length, icon: 'fa-layer-group', color: '#00B4CC' },
    { label: 'Avg Progress', value: `${avgProgress}%`, icon: 'fa-chart-line', color: '#1dbf73' },
    { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, icon: 'fa-rupee-sign', color: '#8b5cf6' },
    { label: 'Open Tickets', value: openTickets, icon: 'fa-ticket-alt', color: '#f59e0b' },
  ];

  return (
    <>
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0]}! 👋`} subtitle="Here's everything happening with your services today." />

      {/* Plan countdowns */}
      {activeOrders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {activeOrders.map(o => <PlanCountdown key={o._id} order={o} />)}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <Card key={i} style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>{s.label}</p>
                <h3 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>{s.value}</h3>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: '1.1rem' }}>
                <i className={`fas ${s.icon}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Two-col summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
        <Card style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem', margin: 0 }}>Recent Services</h3>
            <button onClick={() => setActiveTab('services')} style={{ background: 'none', border: 'none', color: '#00B4CC', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>View all →</button>
          </div>
          {orders.slice(0, 4).map(o => (
            <div key={o._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,180,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00B4CC', fontSize: '0.85rem' }}>
                <i className={o.service?.icon || 'fas fa-star'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.service?.title}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{o.planName} · ₹{o.amount?.toLocaleString('en-IN')}</div>
              </div>
              <Badge status={o.status} />
            </div>
          ))}
          {orders.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '16px 0', fontSize: '0.85rem' }}>No services yet. <Link to="/services" style={{ color: '#00B4CC' }}>Browse →</Link></p>}
        </Card>

        <Card style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem', margin: 0 }}>Service Progress</h3>
            <button onClick={() => setActiveTab('tracker')} style={{ background: 'none', border: 'none', color: '#00B4CC', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>View all →</button>
          </div>
          {trackers.slice(0, 4).map(t => (
            <div key={t._id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1a1a2e' }}>{t.service?.title}</span>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#00B4CC' }}>{t.progressPercent}%</span>
              </div>
              <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${t.progressPercent}%`, background: 'linear-gradient(90deg,#00B4CC,#1dbf73)', borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
          {trackers.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '16px 0', fontSize: '0.85rem' }}>No active trackers.</p>}
        </Card>
      </div>
    </>
  );
}

// ─── My Services ─────────────────────────────────────
function MyServices({ orders, onPurchase, navigate }) {
  return (
    <>
      <PageHeader title="My Services" subtitle="Your purchased services, team assignments, and plan details." />
      {orders.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
          <i className="fas fa-shopping-bag" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: 14, display: 'block' }} />
          <h3 style={{ color: '#1a1a2e', marginBottom: 8 }}>No Services Yet</h3>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Start your growth journey by purchasing a service.</p>
          <Link to="/services" className="btn btn-primary-premium">Browse Services →</Link>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {orders.map(order => <ServiceCard key={order._id} order={order} />)}
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <Link to="/services" className="btn btn-primary-premium" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Browse More Services <i className="fas fa-arrow-right" /></Link>
          </div>
        </div>
      )}
    </>
  );
}

function ServiceCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const posHead = order.posHead;
  const team = order.teamMembers || [];
  const planFeatures = order.service?.plans?.find(p => p.name?.toLowerCase() === order.planName?.toLowerCase())?.features || [];

  return (
    <Card>
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(0,180,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00B4CC', fontSize: '1.4rem', flexShrink: 0 }}>
          <i className={order.service?.icon || 'fas fa-star'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: 0, fontSize: '1rem' }}>{order.service?.title}</h3>
            <Badge status={order.status} />
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            <strong>{order.planName}</strong> plan · {order.invoiceNumber} · ₹{order.amount?.toLocaleString('en-IN')}
          </p>
          {order.startDate && (
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0' }}>
              {new Date(order.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {order.endDate && ` → ${new Date(order.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </p>
          )}
        </div>
        <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 }}>
          {expanded ? 'Hide Details ↑' : 'View Details ↓'}
        </button>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
          {/* Plan features */}
          {planFeatures.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Plan Includes</h4>
              {planFeatures.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '0.82rem', color: '#374151' }}>
                  <i className="fas fa-check" style={{ color: '#1dbf73', fontSize: '0.7rem' }} /> {f}
                </div>
              ))}
            </div>
          )}

          {/* POS Head */}
          {posHead && (
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Your Project Head</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                  {posHead.name?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1a1a2e' }}>{posHead.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{posHead.designation || 'Project Head'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {posHead.email && (
                  <a href={`mailto:${posHead.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'rgba(0,180,204,0.08)', border: '1px solid rgba(0,180,204,0.2)', borderRadius: 8, color: '#00B4CC', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600 }}>
                    <i className="fas fa-envelope" /> Email
                  </a>
                )}
                {posHead.phone && (
                  <a href={`tel:${posHead.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'rgba(29,191,115,0.08)', border: '1px solid rgba(29,191,115,0.2)', borderRadius: 8, color: '#1dbf73', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600 }}>
                    <i className="fas fa-phone" /> Call
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Team members */}
          {team.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Team Members</h4>
              {team.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
                    {m.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1a1a2e' }}>{m.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{m.designation || m.department || 'Team Member'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Service Tracker ─────────────────────────────────
function TrackerSection({ trackers, orders, onRefresh }) {
  const [selected, setSelected] = useState(null);
  const [showRenew, setShowRenew] = useState(false);

  // Keep selected detail panel in sync when parent trackers state updates
  useEffect(() => {
    if (selected) {
      const updated = trackers.find(t => t._id === selected._id);
      if (updated && updated !== selected) setSelected(updated);
    }
  }, [trackers]);

  useEffect(() => {
    // Check if any active order has expired
    const expired = orders.find(o => o.status === 'active' && o.endDate && new Date(o.endDate) < new Date());
    if (expired) setShowRenew(expired);
  }, [orders]);

  return (
    <>
      <PageHeader title="Service Tracker" subtitle="Track progress, updates, and team activity for each service." />

      {/* Renew modal */}
      {showRenew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
            <h2 style={{ color: '#1a1a2e', marginBottom: 8 }}>Your plan has expired</h2>
            <p style={{ color: '#64748b', marginBottom: 24 }}>
              Your <strong>{showRenew.planName}</strong> plan for <strong>{showRenew.service?.title}</strong> expired on {new Date(showRenew.endDate).toLocaleDateString('en-IN')}. Renew to continue receiving services.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setShowRenew(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, color: '#64748b' }}>Later</button>
              <Link to="/services" style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Renew Plan</Link>
            </div>
          </div>
        </div>
      )}

      {trackers.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
          <i className="fas fa-tasks" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: 14, display: 'block' }} />
          <h3 style={{ color: '#1a1a2e', marginBottom: 8 }}>No Active Trackers</h3>
          <p style={{ color: '#64748b' }}>Purchase a service to track its progress.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.6fr' : '1fr', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {trackers.map(t => (
              <Card key={t._id}
                onClick={() => setSelected(selected?._id === t._id ? null : t)}
                style={{ padding: '18px 20px', cursor: 'pointer', borderColor: selected?._id === t._id ? '#00B4CC' : '#e2e8f0', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem', margin: 0 }}>{t.service?.title || t.order?.serviceName}</h3>
                  <Badge status={t.overallStatus} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Overall Progress</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00B4CC' }}>{t.progressPercent}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${t.progressPercent}%`, background: 'linear-gradient(90deg,#00B4CC,#1dbf73)', borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>{t.order?.planName} plan</span>
                  <span>{t.updates?.length || 0} updates</span>
                </div>
              </Card>
            ))}
          </div>

          {selected && (
            <Card style={{ padding: '24px', maxHeight: '80vh', overflowY: 'auto', position: 'sticky', top: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px', fontSize: '1rem' }}>{selected.service?.title || selected.order?.serviceName}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>{selected.order?.planName} plan</p>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem' }}>✕</button>
              </div>

              {/* Plan deliverables checklist (read-only for client) */}
              {(() => {
                const svcTitle = selected.service?.title || selected.order?.serviceName;
                const planFeatures = getPlanFeatures(svcTitle, selected.order?.planName)
                  .length > 0
                  ? getPlanFeatures(svcTitle, selected.order?.planName)
                  : (selected.service?.plans?.find(p => p.name?.toLowerCase() === selected.order?.planName?.toLowerCase())?.features || []);
                const completedFeatures = selected.completedFeatures || [];
                const doneCount = planFeatures.filter(f => completedFeatures.includes(f)).length;
                return planFeatures.length > 0 ? (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Deliverables</h4>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1dbf73' }}>{doneCount}/{planFeatures.length} done</span>
                    </div>
                    <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, marginBottom: 12 }}>
                      <div style={{ height: '100%', width: planFeatures.length ? `${Math.round(doneCount / planFeatures.length * 100)}%` : '0%', background: 'linear-gradient(90deg,#00B4CC,#1dbf73)', borderRadius: 2, transition: 'width 0.4s' }} />
                    </div>
                    {planFeatures.map((f, i) => {
                      const done = completedFeatures.includes(f);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: '0.82rem', color: done ? '#1a1a2e' : '#94a3b8' }}>
                          <div style={{ width: 18, height: 18, borderRadius: 5, background: done ? '#1dbf73' : '#f1f5f9', border: `2px solid ${done ? '#1dbf73' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {done && <i className="fas fa-check" style={{ color: '#fff', fontSize: '0.5rem' }} />}
                          </div>
                          <span style={{ fontWeight: done ? 600 : 400 }}>{f}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : null;
              })()}

              {/* Assigned POS */}
              {selected.assignedTo && (
                <div style={{ background: 'rgba(0,180,204,0.06)', border: '1px solid rgba(0,180,204,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
                    {selected.assignedTo.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1a1a2e' }}>{selected.assignedTo.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Project Head</div>
                  </div>
                </div>
              )}

              {/* Updates timeline */}
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Progress Updates</h4>
              {selected.updates?.filter(u => u.isVisibleToUser).length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>No updates yet. Check back soon.</p>
              )}
              {selected.updates?.filter(u => u.isVisibleToUser).map((upd, i, arr) => (
                <div key={upd._id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: upd.status === 'completed' ? '#1dbf73' : upd.status === 'in-progress' ? '#00B4CC' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: upd.status === 'pending' ? '#94a3b8' : '#fff', fontSize: '0.65rem' }}>
                      <i className={`fas ${upd.status === 'completed' ? 'fa-check' : upd.status === 'in-progress' ? 'fa-spinner' : 'fa-clock'}`} />
                    </div>
                    {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: '#f1f5f9', marginTop: 4, minHeight: 16 }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a2e' }}>{upd.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', margin: '3px 0' }}>{upd.description}</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      {upd.updatedBy?.name && `${upd.updatedBy.name} · `}
                      {new Date(upd.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </>
  );
}

// ─── Requirements ─────────────────────────────────────
function RequirementsSection({ orders, requirements, onRefresh, user }) {
  const [form, setForm] = useState({ orderId: '', type: 'requirement', title: '', description: '', link: '' });
  const [submitting, setSubmitting] = useState(false);
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.orderId || !form.title) return toast.error('Select an order and add a title.');
    setSubmitting(true);
    try {
      const links = form.link ? [{ label: 'Reference', url: form.link }] : [];
      await api.post('/requirements', { ...form, links });
      toast.success('Requirement submitted!');
      setForm({ orderId: '', type: 'requirement', title: '', description: '', link: '' });
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setSubmitting(false);
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await api.post(`/requirements/${id}/reply`, { message: replyText });
      setReplyId(null); setReplyText(''); onRefresh();
    } catch { toast.error('Failed to send reply.'); }
  };

  const TYPE_LABELS = { requirement: '📋 Requirement', update: '🔄 Update', feedback: '💬 Feedback', link: '🔗 Link/Reference', reference: '📎 Reference', approval: '✅ Approval', content: '📝 Content', revision: '✏️ Revision' };

  return (
    <>
      <PageHeader title="Requirements" subtitle="Submit references, requests, and updates. Your team raises requirements here too." />

      {/* Raise new */}
      <Card style={{ padding: '24px', marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 18, fontSize: '0.95rem' }}>Raise a New Request</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Service Order</label>
              <select value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', background: '#fff' }}>
                <option value="">Select an order…</option>
                {orders.map(o => <option key={o._id} value={o._id}>{o.service?.title} — {o.planName}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', background: '#fff' }}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief description of your request" required
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Details</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Additional details, context, or instructions…"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Link (optional)</label>
            <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://…" type="url"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={submitting} style={{ alignSelf: 'flex-start', padding: '10px 24px', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            {submitting ? <><span className="spinner-sm" />Submitting…</> : <><i className="fas fa-paper-plane" />Submit Request</>}
          </button>
        </form>
      </Card>

      {/* Requirements list */}
      <div style={{ display: 'grid', gap: 12 }}>
        {requirements.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '32px' }}>No requirements yet.</p>}
        {requirements.map(req => (
          <Card key={req._id} style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: req.raisedByRole === 'team' ? '#8b5cf6' : '#00B4CC', background: req.raisedByRole === 'team' ? '#f5f3ff' : 'rgba(0,180,204,0.08)', padding: '2px 8px', borderRadius: 20 }}>
                    {req.raisedByRole === 'team' ? '👥 From Team' : '👤 Your Request'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{TYPE_LABELS[req.type] || req.type}</span>
                  <Badge status={req.status} />
                </div>
                <h4 style={{ fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px', fontSize: '0.9rem' }}>{req.title}</h4>
                {req.description && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 6px' }}>{req.description}</p>}
                {req.links?.map((l, i) => <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#00B4CC', marginRight: 8 }}><i className="fas fa-link" /> {l.label || l.url}</a>)}
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
                  {req.raisedBy?.name} · {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <button onClick={() => setReplyId(replyId === req._id ? null : req._id)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', color: '#64748b', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 }}>
                {req.replies?.length ? `${req.replies.length} replies` : 'Reply'}
              </button>
            </div>

            {/* Replies */}
            {replyId === req._id && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, marginTop: 4 }}>
                {req.replies?.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', flexShrink: 0 }}>
                      {r.sender?.name?.charAt(0)}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#1a1a2e' }}>{r.sender?.name}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 6 }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                      <p style={{ fontSize: '0.8rem', color: '#374151', margin: '3px 0 0' }}>{r.message}</p>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Add a reply…"
                    style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.82rem', fontFamily: 'inherit' }} />
                  <button onClick={() => handleReply(req._id)} style={{ padding: '8px 16px', background: '#00B4CC', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Send</button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

// ─── Onboarding Section ───────────────────────────────
function OnboardingSection({ orders }) {
  const activeOrders = orders.filter(o => ['active', 'completed'].includes(o.status));
  const [selectedOrderId, setSelectedOrderId] = useState(activeOrders[0]?._id || null);
  const selectedOrder = activeOrders.find(o => o._id === selectedOrderId);

  if (activeOrders.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '60px', textAlign: 'center' }}>
        <i className="fas fa-rocket" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: 16, display: 'block' }} />
        <h3 style={{ color: '#022B50', marginBottom: 8 }}>No Active Orders</h3>
        <p style={{ color: '#64748b' }}>Complete a purchase to get started with onboarding.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#022B50', marginBottom: 4 }}>Project Onboarding</h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Share your account credentials and brand details to help our team get started quickly.</p>
      {activeOrders.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>SELECT PROJECT</label>
          <select value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}
            style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', cursor: 'pointer', background: '#fff' }}>
            {activeOrders.map(o => (
              <option key={o._id} value={o._id}>{o.service?.title || o.serviceName} — {o.planName}</option>
            ))}
          </select>
        </div>
      )}
      {selectedOrder && <OnboardingForm order={selectedOrder} onComplete={() => {}} />}
    </div>
  );
}

// ─── Payment History ──────────────────────────────────
function PaymentHistory({ orders }) {
  const handleDownload = async (order) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${apiBase}/orders/${order._id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download invoice');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Invoice-${order.invoiceNumber}.pdf`;
      a.click();
    } catch (err) {
      console.error('Invoice download error:', err);
    }
  };

  return (
    <>
      <PageHeader title="Payment History" subtitle="All your transactions and invoice records." />
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Invoice', 'Service', 'Plan', 'Amount', 'Status', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.875rem' }}>No payment history yet.</td></tr>
              ) : orders.map(order => (
                <tr key={order._id} style={{ borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '13px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#00B4CC' }}>{order.invoiceNumber}</td>
                  <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: '#1a1a2e', fontWeight: 600 }}>{order.service?.title}</td>
                  <td style={{ padding: '13px 16px', fontSize: '0.8rem', color: '#64748b' }}>{order.planName}</td>
                  <td style={{ padding: '13px 16px', fontSize: '0.875rem', fontWeight: 800, color: '#1a1a2e' }}>₹{order.amount?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '13px 16px' }}><Badge status={order.status} /></td>
                  <td style={{ padding: '13px 16px', fontSize: '0.78rem', color: '#94a3b8' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <button onClick={() => handleDownload(order)} title="Download Invoice" style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', color: '#64748b', fontSize: '0.8rem' }}>
                      <i className="fas fa-download" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ─── Live Chat ────────────────────────────────────────
function ChatSection({ orders, user, socket }) {
  const [selectedOrder, setSelectedOrder] = useState(orders[0] || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (!selectedOrder) return;
    setLoading(true);
    api.get(`/team-chat/${selectedOrder._id}`).then(r => setMessages(r.data.messages || [])).catch(() => {}).finally(() => setLoading(false));
    socket?.emit('join_room', selectedOrder._id);
    const onMessage = (msg) => setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
    const onTyping = ({ name, isTyping }) => setTyping(isTyping ? name : null);
    socket?.on('new_message', onMessage);
    socket?.on('user_typing', onTyping);
    return () => {
      socket?.emit('leave_room', selectedOrder._id);
      socket?.off('new_message', onMessage);
      socket?.off('user_typing', onTyping);
    };
  }, [selectedOrder?._id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !selectedOrder) return;
    const optimistic = { _id: `temp_${Date.now()}`, sender: { name: user.name }, senderRole: 'client', message: text, createdAt: new Date() };
    setMessages(prev => [...prev, optimistic]);
    socket?.emit('send_message', { room: selectedOrder._id, message: text.trim() });
    setText('');
  };

  const handleTyping = (val) => {
    setText(val);
    socket?.emit('typing', { room: selectedOrder?._id, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket?.emit('typing', { room: selectedOrder?._id, isTyping: false }), 1500);
  };

  const selectOrder = (o) => { setSelectedOrder(o); setShowChat(true); };

  const activeOrders = orders.filter(o => ['active', 'paid'].includes(o.status));

  if (activeOrders.length === 0) {
    return (
      <>
        <PageHeader title="Team Chat" subtitle="Chat directly with your project team." />
        <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
          <i className="fas fa-comments" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: 14, display: 'block' }} />
          <h3 style={{ color: '#1a1a2e', marginBottom: 8 }}>No Active Services</h3>
          <p style={{ color: '#64748b' }}>Chat is available once you have an active service.</p>
          <Link to="/services" className="btn btn-primary-premium" style={{ marginTop: 20, display: 'inline-block' }}>Browse Services</Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Team Chat" subtitle="Real-time chat with your project team." />
      <div className="chat-container">
        {/* Conversation list */}
        <div className={`chat-list${showChat ? ' is-hidden' : ''}`}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Conversations</div>
          {activeOrders.map(o => (
            <button key={o._id} onClick={() => selectOrder(o)}
              style={{ width: '100%', padding: '14px 16px', border: 'none', background: selectedOrder?._id === o._id ? 'rgba(0,180,204,0.08)' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', borderLeft: selectedOrder?._id === o._id ? '3px solid #00B4CC' : '3px solid transparent', transition: 'all 0.15s' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e', marginBottom: 2 }}>{o.service?.title || o.serviceName}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{o.planName} plan</div>
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div className={`chat-pane${!showChat ? ' is-hidden' : ''}`}>
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button className="chat-back-btn" onClick={() => setShowChat(false)}>
              <i className="fas fa-arrow-left" /> Back
            </button>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1dbf73', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a2e', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedOrder?.service?.title || selectedOrder?.serviceName}</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Team is online</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading && <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" /></div>}
            {!loading && messages.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: 'auto' }}>No messages yet. Say hello!</p>}
            {messages.map((msg, i) => {
              const isMe = msg.senderRole === 'client';
              return (
                <div key={msg._id || i} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                  {!isMe && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                      {msg.sender?.name?.charAt(0)}
                    </div>
                  )}
                  <div style={{ maxWidth: '70%' }}>
                    {!isMe && <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: 3, marginLeft: 4 }}>{msg.sender?.name}</div>}
                    <div style={{ background: isMe ? 'linear-gradient(135deg,#00B4CC,#1dbf73)' : '#f1f5f9', color: isMe ? '#fff' : '#1a1a2e', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px', fontSize: '0.875rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {msg.message}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            {typing && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ background: '#f1f5f9', borderRadius: 20, padding: '8px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: `bounce 1.2s ${j * 0.2}s infinite` }} />)}
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 4 }}>{typing} is typing</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8, flexShrink: 0 }}>
            <input value={text} onChange={e => handleTyping(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Type a message…"
              style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', minWidth: 0 }} />
            <button onClick={handleSend} disabled={!text.trim()}
              style={{ padding: '10px 16px', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', border: 'none', borderRadius: 12, cursor: text.trim() ? 'pointer' : 'default', fontSize: '1rem', opacity: text.trim() ? 1 : 0.5, flexShrink: 0 }}>
              <i className="fas fa-paper-plane" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Support Tickets ──────────────────────────────────
function TicketsSection({ tickets, orders, onRefresh }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'general', priority: 'medium', orderId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/tickets', form);
      toast.success('Ticket raised! We\'ll respond within 24 hours.');
      setShowForm(false); setForm({ title: '', description: '', category: 'general', priority: 'medium', orderId: '' }); onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setSubmitting(false);
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await api.post(`/tickets/${selected._id}/reply`, { message: replyText });
      setReplyText(''); onRefresh();
    } catch { toast.error('Failed.'); }
  };

  const CATEGORIES = { billing: '💰 Billing', technical: '🔧 Technical', delivery: '📦 Delivery', revision: '✏️ Revision', general: '💬 General', urgent: '🚨 Urgent' };
  const PRIORITIES = { low: '🟢 Low', medium: '🟡 Medium', high: '🟠 High', urgent: '🔴 Urgent' };

  return (
    <>
      <PageHeader
        title="Support Tickets"
        subtitle="Raise issues and track their resolution."
        action={<button onClick={() => setShowForm(s => !s)} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}><i className="fas fa-plus" /> Raise Ticket</button>}
      />

      {showForm && (
        <Card style={{ padding: '24px', marginBottom: 20 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                  {Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                  {Object.entries(PRIORITIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Related Order (optional)</label>
                <select value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                  <option value="">None</option>
                  {orders.map(o => <option key={o._id} value={o._id}>{o.service?.title}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief issue summary" required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Description *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} required placeholder="Explain the issue in detail…"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={submitting} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {submitting ? 'Submitting…' : 'Submit Ticket'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {tickets.length === 0 && !showForm && <Card style={{ textAlign: 'center', padding: '48px' }}><p style={{ color: '#94a3b8' }}>No tickets raised yet. <button onClick={() => setShowForm(true)} style={{ background: 'none', border: 'none', color: '#00B4CC', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Raise one →</button></p></Card>}
        {tickets.map(ticket => (
          <Card key={ticket._id} style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: selected?._id === ticket._id ? 16 : 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 20 }}>{ticket.ticketId}</span>
                  <Badge status={ticket.status} />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{CATEGORIES[ticket.category] || ticket.category}</span>
                </div>
                <h4 style={{ fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px', fontSize: '0.9rem' }}>{ticket.title}</h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>{ticket.description?.slice(0, 120)}{ticket.description?.length > 120 ? '…' : ''}</p>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 6 }}>{new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {ticket.replies?.length || 0} replies</div>
              </div>
              <button onClick={() => setSelected(selected?._id === ticket._id ? null : ticket)} style={{ padding: '6px 14px', background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', color: '#64748b', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 }}>
                {selected?._id === ticket._id ? 'Close ↑' : 'View ↓'}
              </button>
            </div>

            {selected?._id === ticket._id && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                {ticket.replies?.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, flexDirection: r.isStaff ? 'row' : 'row-reverse' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: r.isStaff ? 'linear-gradient(135deg,#00B4CC,#1dbf73)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: r.isStaff ? '#fff' : '#64748b', flexShrink: 0 }}>
                      {r.sender?.name?.charAt(0)}
                    </div>
                    <div style={{ maxWidth: '70%' }}>
                      <div style={{ background: r.isStaff ? 'rgba(0,180,204,0.08)' : '#f1f5f9', borderRadius: 10, padding: '8px 12px', fontSize: '0.82rem', color: '#1a1a2e' }}>{r.message}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2, textAlign: r.isStaff ? 'left' : 'right' }}>{r.sender?.name} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                ))}
                {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Add a message…"
                      style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.82rem', fontFamily: 'inherit' }} />
                    <button onClick={handleReply} style={{ padding: '9px 16px', background: '#00B4CC', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Send</button>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

// ─── Profile ──────────────────────────────────────────
function Profile({ user, onRefresh }) {
  const { setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', businessName: user?.businessName || '', businessDomain: user?.businessDomain || '', address: user?.address || '' });
  const [saving, setSaving] = useState(false);
  const [twoFA, setTwoFA] = useState(user?.twoFactorEnabled || false);
  const [togglingFA, setTogglingFA] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef(null);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await api.patch('/user/profile', form);
      if (setUser && data.user) setUser(data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setSaving(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Max file size is 2MB.');
    setAvatarLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const { data } = await api.patch('/user/avatar', { avatar: ev.target.result });
          if (setUser && data.user) setUser(data.user);
          toast.success('Profile photo updated!');
        } catch { toast.error('Failed to upload photo.'); }
        setAvatarLoading(false);
      };
      reader.readAsDataURL(file);
    } catch { setAvatarLoading(false); }
  };

  const toggle2FA = async () => {
    setTogglingFA(true);
    try {
      const { data } = await api.patch('/user/toggle-2fa');
      setTwoFA(data.twoFactorEnabled);
      toast.success(data.twoFactorEnabled ? '2FA enabled.' : '2FA disabled.');
    } catch { toast.error('Failed.'); }
    setTogglingFA(false);
  };

  return (
    <>
      <PageHeader title="My Profile" subtitle="Manage your account information and security." />
      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Avatar */}
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.name?.charAt(0)}
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={avatarLoading}
                style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: '#00B4CC', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem' }}>
                {avatarLoading ? '…' : <i className="fas fa-camera" />}
              </button>
            </div>
            <div>
              <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>{user?.name}</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 10px' }}>{user?.email}</p>
              <button onClick={() => fileRef.current?.click()} style={{ padding: '7px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', fontFamily: 'inherit' }}>
                <i className="fas fa-upload" style={{ marginRight: 6 }} /> Upload Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </div>
          </div>
        </Card>

        {/* Profile form */}
        <Card style={{ padding: '28px' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group-row">
              <div className="form-field"><label>Full Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="form-field"><label>Phone</label><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="form-field"><label>Email Address</label><input value={user?.email} disabled style={{ opacity: 0.6 }} /></div>
            <div className="form-group-row">
              <div className="form-field"><label>Business Name</label><input value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} /></div>
              <div className="form-field"><label>Website / Domain</label><input placeholder="yourbrand.com" value={form.businessDomain} onChange={e => setForm(f => ({ ...f, businessDomain: e.target.value }))} /></div>
            </div>
            <div className="form-field"><label>Address</label><textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} style={{ resize: 'vertical' }} /></div>
            <button type="submit" disabled={saving} className="btn btn-consult" style={{ alignSelf: 'flex-start', gap: 8 }}>
              {saving ? <><span className="spinner-sm" />Saving…</> : <><i className="fas fa-save" />Save Changes</>}
            </button>
          </form>
        </Card>

        {/* 2FA */}
        <Card style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: '1.3rem' }}>{twoFA ? '🔐' : '🔓'}</span>
                <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: 0, fontSize: '0.95rem' }}>Two-Factor Authentication</h3>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: twoFA ? '#dcfce7' : '#f1f5f9', color: twoFA ? '#16a34a' : '#94a3b8' }}>{twoFA ? 'ON' : 'OFF'}</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0, maxWidth: 360 }}>{twoFA ? 'OTP required on every login.' : 'Enable for extra account security.'}</p>
            </div>
            <button onClick={toggle2FA} disabled={togglingFA}
              style={{ padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', background: twoFA ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: twoFA ? '#ef4444' : '#fff', flexShrink: 0 }}>
              {togglingFA ? '…' : twoFA ? 'Disable' : 'Enable 2FA'}
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
