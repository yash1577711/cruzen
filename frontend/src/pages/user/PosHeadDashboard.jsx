import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../api/axios.js';
import { getPlanFeatures } from '../../data/planFeatures.js';
import NotificationBell from '../../components/NotificationBell.jsx';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
const ACCENT = '#00B4CC';
const STATUS_OPTIONS = ['not-started', 'in-progress', 'review', 'completed', 'on-hold'];

/* ── tiny helpers ── */
const svcName = (o) => o.service?.title || o.serviceName || '—';

function Sidebar({ user, activeTab, setActiveTab, onLogout, unreadCount, isOpen, onClose, socket }) {
  const tabs = [
    { key: 'projects',     icon: 'fa-briefcase',    label: 'My Projects' },
    { key: 'chat',         icon: 'fa-comments',      label: 'Client Chat', badge: unreadCount },
    { key: 'progress',     icon: 'fa-chart-line',    label: 'Deliverables' },
    { key: 'onboarding',   icon: 'fa-rocket',        label: 'Client Onboarding' },
    { key: 'requirements', icon: 'fa-clipboard-list', label: 'Requirements' },
    { key: 'tickets',      icon: 'fa-headset',       label: 'Support Tickets' },
    { key: 'team',         icon: 'fa-users',         label: 'Manage Team' },
  ];
  const handleTab = (key) => { setActiveTab(key); onClose?.(); };
  return (
    <aside className={`dash-sidebar${isOpen ? ' open' : ''}`}>
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'block' }}>
          <img src="/assets/cruzen.png" alt="Cruzen Digital" style={{ height: 34, width: 'auto', display: 'block' }} />
        </Link>
        <button onClick={onClose} className="dash-close-btn"><i className="fas fa-times" /></button>
      </div>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${ACCENT},#1dbf73)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.85rem', flexShrink: 0 }}>
          {user?.name?.charAt(0)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
          <div style={{ fontSize: '0.68rem', opacity: 0.55 }}>Project Head</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => handleTab(t.key)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px', background: activeTab === t.key ? `rgba(0,180,204,0.15)` : 'none', border: 'none', color: activeTab === t.key ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem', borderLeft: activeTab === t.key ? `3px solid ${ACCENT}` : '3px solid transparent', textAlign: 'left', position: 'relative' }}>
            <i className={`fas ${t.icon}`} style={{ width: 16 }} /> {t.label}
            {t.badge > 0 && <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{t.badge > 99 ? '99+' : t.badge}</span>}
          </button>
        ))}
      </nav>
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
          <i className="fas fa-globe" /> Visit Website
        </Link>
        <button onClick={onLogout} style={{ width: '100%', padding: '9px', background: 'rgba(239,68,68,0.12)', border: 'none', borderRadius: 8, color: '#fca5a5', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.82rem' }}>
          <i className="fas fa-sign-out-alt" style={{ marginRight: 6 }} />Logout
        </button>
      </div>
    </aside>
  );
}

/* ── Chat Panel ── */
function ChatPanel({ orders, user, socket, onRead }) {
  const [selOrder, setSelOrder] = useState(orders[0] || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (!selOrder) return;
    setLoading(true);
    onRead?.();
    api.get(`/team-chat/${selOrder._id}`).then(r => setMessages(r.data.messages || [])).catch(() => {}).finally(() => setLoading(false));
    socket?.emit('join_room', selOrder._id);
    const onMsg = (msg) => setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
    const onTyping = ({ name, isTyping }) => setTyping(isTyping ? name : null);
    socket?.on('new_message', onMsg);
    socket?.on('user_typing', onTyping);
    return () => {
      socket?.emit('leave_room', selOrder._id);
      socket?.off('new_message', onMsg);
      socket?.off('user_typing', onTyping);
    };
  }, [selOrder?._id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = () => {
    if (!text.trim() || !selOrder) return;
    setMessages(prev => [...prev, { _id: `temp_${Date.now()}`, sender: { name: user.name }, senderRole: 'team', message: text, createdAt: new Date() }]);
    socket?.emit('send_message', { room: selOrder._id, message: text.trim() });
    setText('');
  };

  const handleTyping = (val) => {
    setText(val);
    socket?.emit('typing', { room: selOrder?._id, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket?.emit('typing', { room: selOrder?._id, isTyping: false }), 1500);
  };

  const selectOrder = (o) => { setSelOrder(o); setShowChat(true); };

  return (
    <div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>Client Chat</h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 16 }}>Communicate directly with clients on their projects.</p>

      {orders.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center', padding: '60px' }}>
          <i className="fas fa-comments" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: 14, display: 'block' }} />
          <p style={{ color: '#64748b' }}>No projects to chat on yet.</p>
        </div>
      ) : (
        <div className="chat-container">
          {/* Project list */}
          <div className={`chat-list${showChat ? ' is-hidden' : ''}`}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>Projects</div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {orders.map(o => (
                <button key={o._id} onClick={() => selectOrder(o)}
                  style={{ width: '100%', padding: '13px 14px', background: selOrder?._id === o._id ? '#f0fdff' : '#fff', border: 'none', borderLeft: selOrder?._id === o._id ? `3px solid ${ACCENT}` : '3px solid transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'block' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e' }}>{svcName(o)}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{o.user?.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <div className={`chat-pane${!showChat ? ' is-hidden' : ''}`}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <button className="chat-back-btn" onClick={() => setShowChat(false)}>
                <i className="fas fa-arrow-left" /> Back
              </button>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${ACCENT}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>{selOrder?.user?.name?.charAt(0)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selOrder?.user?.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{svcName(selOrder)} · {selOrder?.planName}</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading ? <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                : messages.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: 'auto' }}>No messages yet. Say hello!</p>
                : messages.map((m, i) => {
                  const isMe = m.senderRole === 'team' || m.senderRole === 'admin';
                  return (
                    <div key={m._id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '72%', background: isMe ? `linear-gradient(135deg,${ACCENT},#1dbf73)` : '#f1f5f9', color: isMe ? '#fff' : '#1a1a2e', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px', fontSize: '0.875rem', wordBreak: 'break-word' }}>
                        {!isMe && <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>{m.sender?.name}</div>}
                        <div>{m.message}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.65, marginTop: 4, textAlign: 'right' }}>{new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  );
                })
              }
              {typing && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>{typing} is typing…</div>}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8, flexShrink: 0 }}>
              <input value={text} onChange={e => handleTyping(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Type a message…"
                style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', minWidth: 0 }} />
              <button onClick={send} disabled={!text.trim()}
                style={{ padding: '10px 16px', background: text.trim() ? `linear-gradient(135deg,${ACCENT},#1dbf73)` : '#e2e8f0', color: text.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, cursor: text.trim() ? 'pointer' : 'default', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s', flexShrink: 0 }}>
                <i className="fas fa-paper-plane" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Feature Checklist (shared by PosHead + TeamMember) ── */
function FeatureChecklist({ tracker, order, accentColor, canEdit }) {
  const [completedFeatures, setCompletedFeatures] = useState(tracker?.completedFeatures || []);
  const [toggling, setToggling] = useState(null);

  const serviceName = order?.service?.title || order?.serviceName || '';
  const planName = order?.planName || '';
  const features = getPlanFeatures(serviceName, planName);
  const doneCount = features.filter(f => completedFeatures.includes(f)).length;
  const pct = features.length ? Math.round((doneCount / features.length) * 100) : 0;

  const toggle = async (feature) => {
    if (!canEdit || toggling) return;
    const nowDone = !completedFeatures.includes(feature);
    setToggling(feature);
    setCompletedFeatures(prev => nowDone ? [...prev, feature] : prev.filter(f => f !== feature));
    try {
      const { data } = await api.patch(`/tracker/${tracker._id}/feature`, { featureName: feature, completed: nowDone });
      setCompletedFeatures(data.completedFeatures);
    } catch {
      setCompletedFeatures(prev => nowDone ? prev.filter(f => f !== feature) : [...prev, feature]);
      toast.error('Failed to update feature.');
    }
    setToggling(null);
  };

  if (!features.length) return (
    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
      No plan features found for {serviceName} — {planName}.
    </div>
  );

  return (
    <div>
      {/* Progress summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}><strong style={{ color: '#1a1a2e' }}>{doneCount}</strong> of {features.length} deliverables completed</span>
        <span style={{ fontWeight: 800, fontSize: '1rem', color: accentColor }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, marginBottom: 20 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${accentColor},#1dbf73)`, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>

      {/* Feature list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map((feature, i) => {
          const done = completedFeatures.includes(feature);
          const isToggling = toggling === feature;
          return (
            <div key={i}
              onClick={() => canEdit && toggle(feature)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: done ? `${accentColor}08` : '#f8fafc', border: `1.5px solid ${done ? accentColor + '33' : '#e2e8f0'}`, borderRadius: 10, cursor: canEdit ? 'pointer' : 'default', transition: 'all 0.2s', opacity: isToggling ? 0.6 : 1 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${done ? accentColor : '#d1d5db'}`, background: done ? accentColor : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                {done && <i className="fas fa-check" style={{ color: '#fff', fontSize: '0.6rem' }} />}
              </div>
              <span style={{ fontSize: '0.875rem', color: done ? '#1a1a2e' : '#374151', fontWeight: done ? 600 : 400, textDecoration: done ? 'none' : 'none', flex: 1 }}>{feature}</span>
              {done && <span style={{ fontSize: '0.65rem', color: accentColor, fontWeight: 700, background: `${accentColor}15`, padding: '2px 8px', borderRadius: 20 }}>Done</span>}
            </div>
          );
        })}
      </div>
      {canEdit && <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 12 }}>Click any deliverable to mark it as done. Client can see this in real time.</p>}
    </div>
  );
}

/* ── Progress Update Panel ── */
function ProgressPanel({ orders }) {
  const [selOrder, setSelOrder] = useState(orders[0] || null);
  const [tracker, setTracker] = useState(null);
  const [loadingTracker, setLoadingTracker] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!selOrder) return;
    setLoadingTracker(true);
    setTracker(null);
    api.get(`/tracker/order/${selOrder._id}`)
      .then(r => setTracker(r.data.tracker))
      .catch(() => {})
      .finally(() => setLoadingTracker(false));
  }, [selOrder?._id]);

  const handleNote = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.description.trim()) return toast.error('Title and description required.');
    setSubmitting(true);
    try {
      const { data } = await api.post(`/tracker/${tracker._id}/update`, { title: noteForm.title, description: noteForm.description, status: 'completed' });
      setTracker(data.tracker);
      setNoteForm({ title: '', description: '' });
      toast.success('Note added!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setSubmitting(false);
  };

  const statusColor = { 'not-started': '#94a3b8', 'in-progress': '#00B4CC', 'review': '#f59e0b', 'completed': '#22c55e', 'on-hold': '#ef4444' };

  return (
    <div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>Deliverables Tracker</h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Mark plan deliverables as complete. Clients see updates in real time.</p>

      {orders.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#64748b' }}>No projects assigned yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
          {/* Project list */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', alignSelf: 'start' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Projects</div>
            {orders.map(o => (
              <button key={o._id} onClick={() => setSelOrder(o)}
                style={{ width: '100%', padding: '12px 14px', background: selOrder?._id === o._id ? '#f0fdff' : '#fff', border: 'none', borderLeft: selOrder?._id === o._id ? `3px solid ${ACCENT}` : '3px solid transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1a1a2e' }}>{svcName(o)}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{o.user?.name} · {o.planName}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loadingTracker && <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

            {!loadingTracker && tracker && (
              <>
                {/* Header card */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: '0 0 3px', fontSize: '1rem' }}>{svcName(selOrder)}</h3>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{selOrder?.planName} Plan · {selOrder?.user?.name}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 14px', borderRadius: 20, background: `${statusColor[tracker.overallStatus] || '#94a3b8'}18`, color: statusColor[tracker.overallStatus] || '#94a3b8' }}>
                    {tracker.overallStatus}
                  </span>
                </div>

                {/* Feature checklist */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
                  <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px', fontSize: '0.95rem' }}>Plan Deliverables</h3>
                  <FeatureChecklist tracker={tracker} order={selOrder} accentColor={ACCENT} canEdit={true} />
                </div>

                {/* Add note */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
                  <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: '0 0 14px', fontSize: '0.95rem' }}>Add a Note for Client</h3>
                  <form onSubmit={handleNote} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input value={noteForm.title} onChange={e => setNoteForm(f => ({ ...f, title: e.target.value }))} placeholder="Note title (e.g. Listings uploaded successfully)"
                      style={{ padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit' }} />
                    <textarea value={noteForm.description} onChange={e => setNoteForm(f => ({ ...f, description: e.target.value }))} placeholder="Details for the client…" rows={2}
                      style={{ padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical' }} />
                    <button type="submit" disabled={submitting}
                      style={{ padding: '10px', background: `linear-gradient(135deg,${ACCENT},#1dbf73)`, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.7 : 1 }}>
                      {submitting ? 'Posting…' : 'Send Note to Client'}
                    </button>
                  </form>
                </div>

                {/* Update history (collapsible) */}
                {tracker.updates?.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 24px' }}>
                    <button onClick={() => setShowHistory(h => !h)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem' }}>Client Notes ({tracker.updates.length})</span>
                      <i className={`fas fa-chevron-${showHistory ? 'up' : 'down'}`} style={{ color: '#94a3b8', fontSize: '0.8rem' }} />
                    </button>
                    {showHistory && (
                      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[...tracker.updates].reverse().map((u, i) => (
                          <div key={i} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.82rem' }}>{u.title}</span>
                              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#374151' }}>{u.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {!loadingTracker && !tracker && selOrder && (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No tracker found for this order yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Requirements Panel ── */
function RequirementsPanel({ orders }) {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ orderId: '', type: 'requirement', title: '', description: '', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const STATUSES = ['pending', 'acknowledged', 'in-progress', 'done', 'rejected'];
  const STATUS_COLORS = { pending: '#f59e0b', acknowledged: '#00B4CC', 'in-progress': '#6366f1', done: '#22c55e', rejected: '#ef4444' };

  useEffect(() => {
    api.get('/requirements/admin/all?limit=100')
      .then(r => setRequirements(r.data.requirements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.orderId || !form.title.trim()) return toast.error('Project and title required.');
    setSubmitting(true);
    try {
      const { data } = await api.post('/requirements/team', form);
      setRequirements(r => [data.requirement, ...r]);
      setForm({ orderId: '', type: 'requirement', title: '', description: '', dueDate: '' });
      toast.success('Requirement raised — client notified.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setSubmitting(false);
  };

  const handleStatusChange = async (id, status) => {
    try {
      const { data } = await api.patch(`/requirements/${id}/status`, { status });
      setRequirements(r => r.map(x => x._id === id ? data.requirement : x));
      if (selected?._id === id) setSelected(data.requirement);
    } catch { toast.error('Update failed.'); }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setReplying(true);
    try {
      const { data } = await api.post(`/requirements/${selected._id}/reply`, { message: reply });
      setRequirements(r => r.map(x => x._id === selected._id ? data.requirement : x));
      setSelected(data.requirement);
      setReply('');
    } catch { toast.error('Reply failed.'); }
    setReplying(false);
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>Requirements</h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Raise requirements to clients and track responses.</p>

      {/* Raise new requirement */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px', fontSize: '0.95rem' }}>Raise New Requirement to Client</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Project *</label>
              <select value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))} style={inp}>
                <option value="">Select project…</option>
                {orders.map(o => <option key={o._id} value={o._id}>{svcName(o)} — {o.user?.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inp}>
                {['requirement','content','approval','link','reference','revision','feedback'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Please provide logo files in PNG format" style={inp} />
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional details…" rows={2} style={{ ...inp, resize: 'vertical' }} />
          </div>
          <div>
            <label style={lbl}>Due Date (optional)</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={{ ...inp, width: 180 }} />
          </div>
          <button type="submit" disabled={submitting}
            style={{ padding: '10px 20px', background: `linear-gradient(135deg,${ACCENT},#1dbf73)`, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Raising…' : 'Raise Requirement'}
          </button>
        </form>
      </div>

      {/* Requirements list */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.3fr' : '1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            : requirements.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No requirements yet.</div>
            : requirements.map((r, i) => (
              <div key={r._id} onClick={() => setSelected(selected?._id === r._id ? null : r)}
                style={{ padding: '14px 16px', borderBottom: i < requirements.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', background: selected?._id === r._id ? '#f0fdff' : '#fff', borderLeft: selected?._id === r._id ? `3px solid ${ACCENT}` : '3px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.875rem' }}>{r.title}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, background: `${STATUS_COLORS[r.status]}18`, color: STATUS_COLORS[r.status], padding: '2px 8px', borderRadius: 10 }}>{r.status}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.user?.name} · {r.type}</div>
              </div>
            ))}
        </div>

        {selected && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: 0, fontSize: '0.95rem' }}>{selected.title}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            {selected.description && <p style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 14 }}>{selected.description}</p>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {STATUSES.map(s => (
                <button key={s} onClick={() => handleStatusChange(selected._id, s)}
                  style={{ padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${selected.status === s ? STATUS_COLORS[s] : '#e2e8f0'}`, background: selected.status === s ? `${STATUS_COLORS[s]}18` : '#fff', color: selected.status === s ? STATUS_COLORS[s] : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'inherit' }}>
                  {s}
                </button>
              ))}
            </div>
            {selected.replies?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                {selected.replies.map((r, i) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: 3 }}>{r.sender?.name || 'User'}</div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151' }}>{r.message}</p>
                  </div>
                ))}
              </div>
            )}
            <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Reply…" rows={2} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
            <button onClick={handleReply} disabled={!reply.trim() || replying}
              style={{ padding: '8px 18px', background: `linear-gradient(135deg,${ACCENT},#1dbf73)`, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !reply.trim() || replying ? 0.6 : 1 }}>
              {replying ? 'Sending…' : 'Reply'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Tickets Panel ── */
function TicketsPanel() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const STATUS_COLORS = { open: '#f59e0b', 'in-progress': '#00B4CC', resolved: '#22c55e', closed: '#94a3b8' };
  const STATUSES = ['open', 'in-progress', 'resolved', 'closed'];

  useEffect(() => {
    api.get('/tickets/admin/all')
      .then(r => setTickets(r.data.tickets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const { data } = await api.patch(`/tickets/admin/${id}`, { status });
      setTickets(t => t.map(x => x._id === id ? data.ticket : x));
      if (selected?._id === id) setSelected(data.ticket);
    } catch { toast.error('Update failed.'); }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setReplying(true);
    try {
      const { data } = await api.patch(`/tickets/admin/${selected._id}`, { message: reply });
      setTickets(t => t.map(x => x._id === selected._id ? data.ticket : x));
      setSelected(data.ticket);
      setReply('');
    } catch { toast.error('Reply failed.'); }
    setReplying(false);
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>Support Tickets</h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>View and respond to client support tickets.</p>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.3fr' : '1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            : tickets.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No tickets yet.</div>
            : tickets.map((t, i) => (
              <div key={t._id} onClick={() => setSelected(selected?._id === t._id ? null : t)}
                style={{ padding: '14px 16px', borderBottom: i < tickets.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', background: selected?._id === t._id ? '#f0fdff' : '#fff', borderLeft: selected?._id === t._id ? `3px solid ${ACCENT}` : '3px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.875rem' }}>{t.title}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, background: `${STATUS_COLORS[t.status]}18`, color: STATUS_COLORS[t.status], padding: '2px 8px', borderRadius: 10 }}>{t.status}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{t.user?.name} · {t.priority}</div>
              </div>
            ))}
        </div>

        {selected && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: 0, fontSize: '0.95rem' }}>{selected.title}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 14 }}>{selected.description}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {STATUSES.map(s => (
                <button key={s} onClick={() => handleStatusChange(selected._id, s)}
                  style={{ padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${selected.status === s ? STATUS_COLORS[s] : '#e2e8f0'}`, background: selected.status === s ? `${STATUS_COLORS[s]}18` : '#fff', color: selected.status === s ? STATUS_COLORS[s] : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'inherit' }}>
                  {s}
                </button>
              ))}
            </div>
            {selected.replies?.length > 0 && (
              <div style={{ marginBottom: 14, maxHeight: 200, overflowY: 'auto' }}>
                {selected.replies.map((r, i) => (
                  <div key={i} style={{ background: r.isStaff ? 'rgba(0,180,204,0.06)' : '#f8fafc', borderRadius: 8, padding: '9px 12px', marginBottom: 6, borderLeft: r.isStaff ? `3px solid ${ACCENT}` : '3px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: 3 }}>{r.isStaff ? 'Staff' : 'Client'}</div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151' }}>{r.message}</p>
                  </div>
                ))}
              </div>
            )}
            <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Reply to client…" rows={2} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
            <button onClick={handleReply} disabled={!reply.trim() || replying}
              style={{ padding: '8px 18px', background: `linear-gradient(135deg,${ACCENT},#1dbf73)`, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !reply.trim() || replying ? 0.6 : 1 }}>
              {replying ? 'Sending…' : 'Reply'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' };
const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };

function PosOnboardingView({ orders }) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?._id || '');
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedOrderId) return;
    setLoading(true);
    api.get(`/onboarding/pos/${selectedOrderId}`).then(r => {
      setOnboarding(r.data.onboarding);
    }).catch(() => setOnboarding(null)).finally(() => setLoading(false));
  }, [selectedOrderId]);

  const row = (label, value) => value ? (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 180, fontSize: '0.78rem', fontWeight: 700, color: '#64748b', flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: '0.85rem', color: '#1a1a2e', wordBreak: 'break-word' }}>{value}</div>
    </div>
  ) : null;

  return (
    <div>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>Client Onboarding Details</h2>
      <p style={{ color: '#64748b', marginBottom: 20, fontSize: '0.875rem' }}>Platform credentials and brand info submitted by the client.</p>
      {orders.length > 1 && (
        <select value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}
          style={{ ...inp, width: 'auto', minWidth: 280, marginBottom: 20, cursor: 'pointer' }}>
          <option value="">Select a project…</option>
          {orders.map(o => <option key={o._id} value={o._id}>{o.service?.title || o.serviceName} — {o.planName}</option>)}
        </select>
      )}
      {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}
      {!loading && !onboarding && <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Client has not submitted onboarding details yet.</div>}
      {!loading && onboarding && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px' }}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, color: '#022B50', fontSize: '0.9rem', marginBottom: 12, borderBottom: '2px solid #e2e8f0', paddingBottom: 8 }}>Platform / Account</h3>
            {row('Platform', onboarding.platformCredentials?.platform)}
            {row('Store Name', onboarding.platformCredentials?.storeName)}
            {row('Account ID', onboarding.platformCredentials?.accountId)}
            {row('Store URL', onboarding.platformCredentials?.storeUrl)}
            {row('Login Email', onboarding.platformCredentials?.loginEmail)}
            {row('Login Password', onboarding.platformCredentials?.loginPassword)}
            {row('GSTIN', onboarding.platformCredentials?.gstin)}
          </div>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, color: '#022B50', fontSize: '0.9rem', marginBottom: 12, borderBottom: '2px solid #e2e8f0', paddingBottom: 8 }}>Brand Assets</h3>
            {row('Brand Name', onboarding.brandAssets?.brandName)}
            {row('Description', onboarding.brandAssets?.brandDescription)}
            {row('Target Audience', onboarding.brandAssets?.targetAudience)}
            {row('Competitors', onboarding.brandAssets?.competitorUrls)}
            {onboarding.brandAssets?.primaryColor && row('Brand Color', <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 16, height: 16, background: onboarding.brandAssets.primaryColor, borderRadius: 4, display: 'inline-block', border: '1px solid #e2e8f0' }} />{onboarding.brandAssets.primaryColor}</span>)}
            {row('Logo / Assets', onboarding.brandAssets?.logoUrl ? <a href={onboarding.brandAssets.logoUrl} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>View Files</a> : null)}
          </div>
          <div>
            <h3 style={{ fontWeight: 700, color: '#022B50', fontSize: '0.9rem', marginBottom: 12, borderBottom: '2px solid #e2e8f0', paddingBottom: 8 }}>Contact & Goals</h3>
            {row('WhatsApp', onboarding.contactPreferences?.whatsappNumber)}
            {row('Preferred Contact', onboarding.contactPreferences?.preferredContactMethod)}
            {row('Best Time', onboarding.contactPreferences?.preferredTime)}
            {row('Business Goals', onboarding.businessGoals)}
            {row('Additional Notes', onboarding.additionalNotes)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function PosHeadDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [addMemberForm, setAddMemberForm] = useState({ orderId: '', email: '' });
  const [adding, setAdding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const socketRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadData();
    const token = localStorage.getItem('accessToken');
    if (token) {
      const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;
      socket.on('connect_error', () => {});
      socket.on('new_message', () => setUnreadCount(c => c + 1));
    }
    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    api.get('/team-chat/unread/count').then(r => setUnreadCount(r.data.count || 0)).catch(() => {});
  }, []);

  const loadData = async () => {
    try {
      const { data } = await api.get('/admin/pos/my-orders');
      setOrders(data.orders || []);
    } catch { toast.error('Failed to load orders.'); }
    setLoading(false);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addMemberForm.orderId || !addMemberForm.email) return toast.error('Select a project and enter an email.');
    setAdding(true);
    try {
      await api.post('/admin/pos/add-member', addMemberForm);
      toast.success('Team member added!');
      setAddMemberForm({ orderId: '', email: '' });
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setAdding(false);
  };

  const handleCompleteOrder = async (orderId) => {
    if (!window.confirm('Mark this project as completed? The client will be notified.')) return;
    try {
      await api.patch(`/orders/${orderId}/complete`);
      toast.success('Project marked as completed!');
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  const stats = [
    { label: 'Total Projects', value: orders.length, color: ACCENT },
    { label: 'Active', value: orders.filter(o => o.status === 'active').length, color: '#1dbf73' },
    { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: '#8b5cf6' },
    { label: 'Team Members', value: [...new Set(orders.flatMap(o => o.teamMembers?.map(m => m._id) || []))].length, color: '#f59e0b' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex' }}>
      {sidebarOpen && <div className="dash-overlay active" onClick={() => setSidebarOpen(false)} />}
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} unreadCount={unreadCount} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} socket={socketRef.current} />

      <div className="dash-mobile-topbar">
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 8px' }}>
          <i className="fas fa-bars" />
        </button>
        <img src="/assets/cruzen.png" alt="Cruzen Digital" style={{ height: 26, width: 'auto' }} />
        <NotificationBell color="rgba(255,255,255,0.85)" socket={socketRef.current} />
      </div>

      <main className="dash-main" style={{ minWidth: 0 }}>
        <div className="dash-bell-desktop" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ background: '#011e38', borderRadius: 10, padding: '6px 10px' }}>
            <NotificationBell color="#fff" socket={socketRef.current} />
          </div>
        </div>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 28 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>{s.label}</p>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1a1a2e', margin: 0 }}>{s.value}</h3>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: '1rem' }}>
                <i className="fas fa-layer-group" />
              </div>
            </div>
          ))}
        </div>

        {/* Tab: Projects */}
        {activeTab === 'projects' && (
          <>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>My Projects</h1>
            <p style={{ color: '#64748b', marginBottom: 20, fontSize: '0.875rem' }}>All client orders assigned to you.</p>
            {orders.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center', padding: '60px' }}>
                <i className="fas fa-briefcase" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: 14, display: 'block' }} />
                <p style={{ color: '#64748b' }}>No projects assigned yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {orders.map(order => (
                  <div key={order._id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '1rem', marginBottom: 4 }}>{svcName(order)}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.planName} plan · {order.invoiceNumber}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                          Client: <strong style={{ color: '#374151' }}>{order.user?.name}</strong>
                          {order.user?.email && <span> · {order.user.email}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', background: order.status === 'active' ? '#dcfce7' : '#f1f5f9', color: order.status === 'active' ? '#16a34a' : '#64748b', padding: '3px 10px', borderRadius: 50, fontWeight: 700 }}>{order.status}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{order.teamMembers?.length || 0} members</span>
                        <button onClick={() => setActiveTab('chat')} style={{ padding: '5px 12px', background: `${ACCENT}12`, border: `1px solid ${ACCENT}33`, borderRadius: 8, color: ACCENT, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit' }}>
                          <i className="fas fa-comments" style={{ marginRight: 4 }} />Chat
                        </button>
                        <button onClick={() => setActiveTab('progress')} style={{ padding: '5px 12px', background: 'rgba(29,191,115,0.08)', border: '1px solid rgba(29,191,115,0.2)', borderRadius: 8, color: '#1dbf73', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit' }}>
                          <i className="fas fa-chart-line" style={{ marginRight: 4 }} />Progress
                        </button>
                        {order.user?.phone && (
                          <a href={`tel:${order.user.phone}`} style={{ padding: '5px 12px', background: 'rgba(29,191,115,0.08)', border: '1px solid rgba(29,191,115,0.2)', borderRadius: 8, color: '#1dbf73', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}>
                            <i className="fas fa-phone" style={{ marginRight: 4 }} />{order.user.phone}
                          </a>
                        )}
                        {order.status === 'active' && (
                          <button onClick={() => handleCompleteOrder(order._id)} style={{ padding: '5px 12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, color: '#6366f1', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit' }}>
                            <i className="fas fa-flag-checkered" style={{ marginRight: 4 }} />Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab: Chat */}
        {activeTab === 'chat' && <ChatPanel orders={orders} user={user} socket={socketRef.current} onRead={() => setUnreadCount(0)} />}

        {/* Tab: Progress */}
        {activeTab === 'progress' && <ProgressPanel orders={orders} />}

        {/* Tab: Onboarding */}
        {activeTab === 'onboarding' && <PosOnboardingView orders={orders} />}

        {/* Tab: Requirements */}
        {activeTab === 'requirements' && <RequirementsPanel orders={orders} />}

        {/* Tab: Tickets */}
        {activeTab === 'tickets' && <TicketsPanel />}

        {/* Tab: Team */}
        {activeTab === 'team' && (
          <>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>Manage Team</h1>
            <p style={{ color: '#64748b', marginBottom: 20, fontSize: '0.875rem' }}>Add team members to your projects by email.</p>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px', marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 18, fontSize: '0.95rem' }}>Add Team Member</h3>
              <form onSubmit={handleAddMember} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Select Project</label>
                  <select value={addMemberForm.orderId} onChange={e => setAddMemberForm(f => ({ ...f, orderId: e.target.value }))} required
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                    <option value="">Choose a project…</option>
                    {orders.map(o => <option key={o._id} value={o._id}>{svcName(o)} — {o.user?.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Team Member Email</label>
                  <input type="email" value={addMemberForm.email} onChange={e => setAddMemberForm(f => ({ ...f, email: e.target.value }))} placeholder="member@company.com" required
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={adding}
                  style={{ padding: '10px 20px', background: `linear-gradient(135deg,${ACCENT},#1dbf73)`, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: adding ? 0.7 : 1 }}>
                  {adding ? 'Adding…' : '+ Add Member'}
                </button>
              </form>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 10 }}>If the email is not registered, a new team member account will be created and invite sent.</p>
            </div>

            {orders.filter(o => o.teamMembers?.length > 0).map(order => (
              <div key={order._id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px', marginBottom: 12 }}>
                <h4 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 12, fontSize: '0.9rem' }}>{svcName(order)} — {order.user?.name}</h4>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {order.teamMembers.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 50 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${ACCENT}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: ACCENT }}>{m.name?.charAt(0)}</div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {orders.every(o => !o.teamMembers?.length) && (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
                <p style={{ color: '#94a3b8' }}>No team members added yet.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
