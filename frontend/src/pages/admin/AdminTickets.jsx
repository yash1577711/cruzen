import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AdminLayout } from './AdminDashboard.jsx';
import api from '../../api/axios.js';

const STATUS_COLORS = { open: '#f59e0b', 'in-progress': '#00B4CC', resolved: '#22c55e', closed: '#94a3b8' };
const PRIORITY_COLORS = { low: '#94a3b8', medium: '#f59e0b', high: '#ef4444', urgent: '#dc2626' };
const STATUSES = ['open', 'in-progress', 'resolved', 'closed'];

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = async (status = '') => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tickets/admin/all${status ? `?status=${status}` : ''}`);
      setTickets(data.tickets || []);
    } catch { toast.error('Failed to load tickets.'); }
    setLoading(false);
  };

  useEffect(() => { load(filterStatus); }, [filterStatus]);

  const handleStatusChange = async (ticketId, status) => {
    setUpdatingStatus(true);
    try {
      const { data } = await api.patch(`/tickets/admin/${ticketId}`, { status });
      setTickets(t => t.map(x => x._id === ticketId ? data.ticket : x));
      if (selected?._id === ticketId) setSelected(data.ticket);
      toast.success('Status updated.');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
    setUpdatingStatus(false);
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setReplying(true);
    try {
      const { data } = await api.patch(`/tickets/admin/${selected._id}`, { message: reply });
      setTickets(t => t.map(x => x._id === selected._id ? data.ticket : x));
      setSelected(data.ticket);
      setReply('');
      toast.success('Reply sent.');
    } catch (err) { toast.error(err.response?.data?.message || 'Reply failed.'); }
    setReplying(false);
  };

  const filteredTickets = tickets;

  return (
    <AdminLayout title="Support Tickets" subtitle="Manage and respond to client support tickets.">
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{ padding: '7px 16px', borderRadius: 50, border: `1.5px solid ${filterStatus === s ? '#00B4CC' : '#e2e8f0'}`, background: filterStatus === s ? '#00B4CC' : '#fff', color: filterStatus === s ? '#fff' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit' }}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#94a3b8', alignSelf: 'center' }}>{filteredTickets.length} tickets</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.4fr' : '1fr', gap: 16, alignItems: 'start' }}>
        {/* Ticket list */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : filteredTickets.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>No tickets found.</div>
          ) : filteredTickets.map((t, i) => (
            <div key={t._id}
              onClick={() => setSelected(selected?._id === t._id ? null : t)}
              style={{ padding: '16px 18px', borderBottom: i < filteredTickets.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', background: selected?._id === t._id ? '#f0fdff' : '#fff', borderLeft: selected?._id === t._id ? '3px solid #00B4CC' : '3px solid transparent', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.875rem', flex: 1, marginRight: 10 }}>{t.title}</div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${STATUS_COLORS[t.status]}18`, color: STATUS_COLORS[t.status], flexShrink: 0 }}>
                  {t.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{t.user?.name}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: PRIORITY_COLORS[t.priority], background: `${PRIORITY_COLORS[t.priority]}18`, padding: '1px 7px', borderRadius: 10 }}>{t.priority}</span>
                {t.order?.posHead && (
                  <span style={{ fontSize: '0.62rem', color: '#0369a1', background: '#e0f2fe', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>
                    <i className="fas fa-user-tie" style={{ marginRight: 3 }} />{t.order.posHead.name}
                  </span>
                )}
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: 'auto' }}>
                  {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              {t.replies?.length > 0 && (
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>
                  <i className="fas fa-comment" style={{ marginRight: 4 }} />{t.replies.length} replies
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px', position: 'sticky', top: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>{selected.title}</h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>By <strong>{selected.user?.name}</strong> · {selected.user?.email}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem' }}>✕</button>
            </div>

            {/* Metadata */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, background: `${STATUS_COLORS[selected.status]}18`, color: STATUS_COLORS[selected.status], padding: '3px 10px', borderRadius: 20 }}>{selected.status}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: PRIORITY_COLORS[selected.priority], background: `${PRIORITY_COLORS[selected.priority]}18`, padding: '3px 10px', borderRadius: 20 }}>{selected.priority} priority</span>
              {selected.order && <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: 20 }}>{selected.order.invoiceNumber}</span>}
            </div>

            {/* Description */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{selected.description}</p>
            </div>

            {/* Status change */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Change Status</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => handleStatusChange(selected._id, s)} disabled={updatingStatus || selected.status === s}
                    style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${selected.status === s ? STATUS_COLORS[s] : '#e2e8f0'}`, background: selected.status === s ? `${STATUS_COLORS[s]}18` : '#fff', color: selected.status === s ? STATUS_COLORS[s] : '#64748b', fontWeight: 600, cursor: selected.status === s ? 'default' : 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Replies */}
            {selected.replies?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>Conversation</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {selected.replies.map((r, i) => (
                    <div key={i} style={{ background: r.isStaff ? 'rgba(0,180,204,0.06)' : '#f8fafc', borderRadius: 8, padding: '10px 12px', borderLeft: r.isStaff ? '3px solid #00B4CC' : '3px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: 4 }}>
                        {r.isStaff ? '(Staff)' : 'Client'} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151' }}>{r.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply box */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Reply to Client</label>
              <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your response…" rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
              <button onClick={handleReply} disabled={!reply.trim() || replying}
                style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: reply.trim() && !replying ? 'pointer' : 'not-allowed', opacity: !reply.trim() || replying ? 0.6 : 1, fontFamily: 'inherit' }}>
                {replying ? 'Sending…' : 'Send Reply'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
