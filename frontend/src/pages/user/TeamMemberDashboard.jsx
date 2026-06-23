import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../api/axios.js';
import { getPlanFeatures } from '../../data/planFeatures.js';
import NotificationBell from '../../components/NotificationBell.jsx';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
const ACCENT = '#1dbf73';
const STATUS_OPTIONS = ['not-started', 'in-progress', 'review', 'completed', 'on-hold'];

const svcName = (o) => o.service?.title || o.serviceName || '—';

function Sidebar({ user, activeTab, setActiveTab, onLogout, unreadCount, isOpen, onClose, socket }) {
  const tabs = [
    { key: 'projects',     icon: 'fa-layer-group',   label: 'My Projects' },
    { key: 'chat',         icon: 'fa-comments',       label: 'Client Chat', badge: unreadCount },
    { key: 'progress',     icon: 'fa-chart-line',     label: 'Deliverables' },
    { key: 'requirements', icon: 'fa-clipboard-list', label: 'Requirements' },
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
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${ACCENT},#00B4CC)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.85rem', flexShrink: 0 }}>
          {user?.name?.charAt(0)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
          <div style={{ fontSize: '0.68rem', opacity: 0.55 }}>{user?.designation || 'Team Member'}</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => handleTab(t.key)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px', background: activeTab === t.key ? `rgba(29,191,115,0.12)` : 'none', border: 'none', color: activeTab === t.key ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem', borderLeft: activeTab === t.key ? `3px solid ${ACCENT}` : '3px solid transparent', textAlign: 'left' }}>
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
function ChatPanel({ projects, user, socket, onRead }) {
  const [selOrder, setSelOrder] = useState(projects[0] || null);
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
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 16 }}>Chat directly with clients on your assigned projects.</p>

      {projects.length === 0 ? (
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
              {projects.map(o => (
                <button key={o._id} onClick={() => selectOrder(o)}
                  style={{ width: '100%', padding: '13px 14px', background: selOrder?._id === o._id ? '#f0fff8' : '#fff', border: 'none', borderLeft: selOrder?._id === o._id ? `3px solid ${ACCENT}` : '3px solid transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'block' }}>
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
                : messages.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: 'auto' }}>No messages yet.</p>
                : messages.map((m, i) => {
                  const isMe = m.senderRole === 'team' || m.senderRole === 'admin';
                  return (
                    <div key={m._id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '72%', background: isMe ? `linear-gradient(135deg,${ACCENT},#00B4CC)` : '#f1f5f9', color: isMe ? '#fff' : '#1a1a2e', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px', fontSize: '0.875rem', wordBreak: 'break-word' }}>
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
                style={{ padding: '10px 16px', background: text.trim() ? `linear-gradient(135deg,${ACCENT},#00B4CC)` : '#e2e8f0', color: text.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, cursor: text.trim() ? 'pointer' : 'default', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s', flexShrink: 0 }}>
                <i className="fas fa-paper-plane" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Feature Checklist ── */
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}><strong style={{ color: '#1a1a2e' }}>{doneCount}</strong> of {features.length} deliverables completed</span>
        <span style={{ fontWeight: 800, fontSize: '1rem', color: accentColor }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, marginBottom: 20 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${accentColor},#00B4CC)`, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
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
              <span style={{ fontSize: '0.875rem', color: done ? '#1a1a2e' : '#374151', fontWeight: done ? 600 : 400, flex: 1 }}>{feature}</span>
              {done && <span style={{ fontSize: '0.65rem', color: accentColor, fontWeight: 700, background: `${accentColor}15`, padding: '2px 8px', borderRadius: 20 }}>Done</span>}
            </div>
          );
        })}
      </div>
      {canEdit && <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 12 }}>Click any deliverable to mark it as done. Client can see this in real time.</p>}
    </div>
  );
}

/* ── Progress Panel ── */
function ProgressPanel({ projects }) {
  const [selOrder, setSelOrder] = useState(projects[0] || null);
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
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Mark plan deliverables complete. Clients see updates instantly.</p>

      {projects.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#64748b' }}>No projects assigned yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', alignSelf: 'start' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Projects</div>
            {projects.map(o => (
              <button key={o._id} onClick={() => setSelOrder(o)}
                style={{ width: '100%', padding: '12px 14px', background: selOrder?._id === o._id ? '#f0fff8' : '#fff', border: 'none', borderLeft: selOrder?._id === o._id ? `3px solid ${ACCENT}` : '3px solid transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1a1a2e' }}>{svcName(o)}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{o.user?.name} · {o.planName}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loadingTracker && <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

            {!loadingTracker && tracker && (
              <>
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: '0 0 3px', fontSize: '1rem' }}>{svcName(selOrder)}</h3>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{selOrder?.planName} Plan · {selOrder?.user?.name}</span>
                    {selOrder?.posHead && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>Head: {selOrder.posHead.name}</div>}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 14px', borderRadius: 20, background: `${statusColor[tracker.overallStatus] || '#94a3b8'}18`, color: statusColor[tracker.overallStatus] || '#94a3b8' }}>
                    {tracker.overallStatus}
                  </span>
                </div>

                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
                  <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px', fontSize: '0.95rem' }}>Plan Deliverables</h3>
                  <FeatureChecklist tracker={tracker} order={selOrder} accentColor={ACCENT} canEdit={true} />
                </div>

                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
                  <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: '0 0 14px', fontSize: '0.95rem' }}>Add a Note for Client</h3>
                  <form onSubmit={handleNote} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input value={noteForm.title} onChange={e => setNoteForm(f => ({ ...f, title: e.target.value }))} placeholder="Note title"
                      style={{ padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit' }} />
                    <textarea value={noteForm.description} onChange={e => setNoteForm(f => ({ ...f, description: e.target.value }))} placeholder="Details for the client…" rows={2}
                      style={{ padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical' }} />
                    <button type="submit" disabled={submitting}
                      style={{ padding: '10px', background: `linear-gradient(135deg,${ACCENT},#00B4CC)`, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.7 : 1 }}>
                      {submitting ? 'Posting…' : 'Send Note to Client'}
                    </button>
                  </form>
                </div>

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
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No tracker found for this project yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Requirements Panel (team member view — read + reply only) ── */
function RequirementsPanel({ projects }) {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const STATUS_COLORS = { pending: '#f59e0b', acknowledged: '#00B4CC', 'in-progress': '#6366f1', done: '#22c55e', rejected: '#ef4444' };

  useEffect(() => {
    const orderIds = projects.map(p => p._id);
    if (!orderIds.length) { setLoading(false); return; }
    Promise.all(orderIds.map(id => api.get(`/requirements/order/${id}`).then(r => r.data.requirements || []).catch(() => [])))
      .then(results => setRequirements(results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .finally(() => setLoading(false));
  }, [projects]);

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
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Requirements raised by clients or your project head.</p>
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
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.user?.name} · {r.type} · by {r.raisedByRole}</div>
              </div>
            ))}
        </div>
        {selected && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: 0, fontSize: '0.95rem' }}>{selected.title}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            {selected.description && <p style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 12 }}>{selected.description}</p>}
            {selected.replies?.map((r, i) => (
              <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '9px 12px', marginBottom: 6 }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: 3 }}>{r.sender?.name || 'User'}</div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151' }}>{r.message}</p>
              </div>
            ))}
            <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Reply…" rows={2} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', marginTop: 8, marginBottom: 8 }} />
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

/* ── Main ── */
export default function TeamMemberDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const socketRef = useRef(null);

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
      const { data } = await api.get('/admin/team-member/my-projects');
      setProjects(data.orders || []);
    } catch { toast.error('Failed to load projects.'); }
    setLoading(false);
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  const totalProgress = projects.length ? Math.round(projects.reduce((s, p) => s + (p.tracker?.progressPercent || 0), 0) / projects.length) : 0;

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
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Projects', value: projects.length, color: '#00B4CC', icon: 'fa-layer-group' },
            { label: 'Avg Progress', value: `${totalProgress}%`, color: ACCENT, icon: 'fa-chart-line' },
            { label: 'Active', value: projects.filter(p => p.status === 'active').length, color: '#8b5cf6', icon: 'fa-bolt' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>{s.label}</p>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1a1a2e', margin: 0 }}>{s.value}</h3>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                <i className={`fas ${s.icon}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Tab: Projects */}
        {activeTab === 'projects' && (
          <>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>My Projects</h1>
            <p style={{ color: '#64748b', marginBottom: 20, fontSize: '0.875rem' }}>Projects assigned to you by your project head.</p>
            {projects.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center', padding: '60px' }}>
                <i className="fas fa-layer-group" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: 14, display: 'block' }} />
                <p style={{ color: '#64748b' }}>No projects assigned yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {projects.map(order => (
                  <div key={order._id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px', fontSize: '1rem' }}>{svcName(order)}</h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{order.planName} plan · Client: <strong>{order.user?.name}</strong></p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', background: order.status === 'active' ? '#dcfce7' : '#f1f5f9', color: order.status === 'active' ? '#16a34a' : '#64748b', padding: '3px 10px', borderRadius: 50, fontWeight: 700 }}>{order.status}</span>
                        <button onClick={() => setActiveTab('chat')} style={{ padding: '5px 12px', background: 'rgba(0,180,204,0.08)', border: '1px solid rgba(0,180,204,0.2)', borderRadius: 8, color: '#00B4CC', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit' }}>
                          <i className="fas fa-comments" style={{ marginRight: 4 }} />Chat
                        </button>
                        <button onClick={() => setActiveTab('progress')} style={{ padding: '5px 12px', background: `rgba(29,191,115,0.08)`, border: `1px solid rgba(29,191,115,0.2)`, borderRadius: 8, color: ACCENT, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit' }}>
                          <i className="fas fa-chart-line" style={{ marginRight: 4 }} />Update
                        </button>
                      </div>
                    </div>
                    {order.tracker && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Progress</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ACCENT }}>{order.tracker.progressPercent}%</span>
                        </div>
                        <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${order.tracker.progressPercent}%`, background: `linear-gradient(90deg,#00B4CC,${ACCENT})`, borderRadius: 3 }} />
                        </div>
                      </div>
                    )}
                    {order.posHead && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9', fontSize: '0.78rem', color: '#64748b' }}>
                        Project Head: <strong style={{ color: '#374151' }}>{order.posHead.name}</strong>
                        {order.posHead.email && <span> · <a href={`mailto:${order.posHead.email}`} style={{ color: '#00B4CC' }}>{order.posHead.email}</a></span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'chat' && <ChatPanel projects={projects} user={user} socket={socketRef.current} onRead={() => setUnreadCount(0)} />}
        {activeTab === 'progress' && <ProgressPanel projects={projects} />}
        {activeTab === 'requirements' && <RequirementsPanel projects={projects} />}
      </main>
    </div>
  );
}
