import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios.js';

const TYPE_ICONS = {
  order_confirmed: { icon: 'fa-check-circle', color: '#1dbf73' },
  order_assigned: { icon: 'fa-tasks', color: '#00B4CC' },
  order_completed: { icon: 'fa-flag-checkered', color: '#6366f1' },
  tracker_updated: { icon: 'fa-chart-line', color: '#00B4CC' },
  payment_received: { icon: 'fa-rupee-sign', color: '#1dbf73' },
  team_member_added: { icon: 'fa-user-plus', color: '#6366f1' },
  project_assigned: { icon: 'fa-briefcase', color: '#f59e0b' },
  message_received: { icon: 'fa-comment-dots', color: '#00B4CC' },
  requirement_raised: { icon: 'fa-clipboard-list', color: '#f59e0b' },
  requirement_replied: { icon: 'fa-reply', color: '#00B4CC' },
  ticket_updated: { icon: 'fa-headset', color: '#ef4444' },
  renewal_reminder: { icon: 'fa-bell', color: '#f59e0b' },
  general: { icon: 'fa-info-circle', color: '#64748b' },
};

export default function NotificationBell({ color = '#fff', socket = null }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/notifications?limit=15');
      setNotifications(r.data.notifications || []);
      setUnreadCount(r.data.unreadCount || 0);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial unread count (lightweight)
    api.get('/notifications/unread/count').then(r => setUnreadCount(r.data.count || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Real-time socket notification
  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      setUnreadCount(c => c + 1);
      setNotifications(prev => [notif, ...prev.slice(0, 14)]);
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markRead = async (id, link) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    if (link) window.location.href = link;
    setOpen(false);
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const timeAgo = (date) => {
    const secs = Math.floor((Date.now() - new Date(date)) / 1000);
    if (secs < 60) return 'just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '4px 6px', color, display: 'flex', alignItems: 'center' }}
        title="Notifications"
      >
        <i className="fas fa-bell" style={{ fontSize: '1.1rem' }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#ef4444', color: '#fff',
            borderRadius: '50%', fontSize: '0.6rem', fontWeight: 700,
            minWidth: 16, height: 16, lineHeight: '16px',
            textAlign: 'center', padding: '0 3px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%',
          width: 340, maxWidth: 'calc(100vw - 32px)',
          background: '#fff', borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
          border: '1px solid #e2e8f0',
          zIndex: 9999,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, color: '#022B50', fontSize: '0.95rem' }}>
              Notifications {unreadCount > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: '0.7rem', marginLeft: 6 }}>{unreadCount}</span>}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--secondary-color)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                <i className="fas fa-bell" style={{ fontSize: '2rem', marginBottom: 12, display: 'block', opacity: 0.3 }} />
                No notifications yet
              </div>
            ) : notifications.map(n => {
              const meta = TYPE_ICONS[n.type] || TYPE_ICONS.general;
              return (
                <div
                  key={n._id}
                  onClick={() => markRead(n._id, n.link)}
                  style={{
                    display: 'flex', gap: 12, padding: '14px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    background: n.isRead ? '#fff' : '#f0f9ff',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = n.isRead ? '#fff' : '#f0f9ff'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: `${meta.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: meta.color, fontSize: '0.85rem',
                  }}>
                    <i className={`fas ${meta.icon}`} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#022B50', fontSize: '0.82rem', marginBottom: 2 }}>{n.title}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.4, marginBottom: 4 }}>{n.body}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.isRead && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00B4CC', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
