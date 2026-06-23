import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AdminLayout } from './AdminDashboard.jsx';
import api from '../../api/axios.js';

const STATUS_COLORS = { pending: '#f59e0b', acknowledged: '#00B4CC', 'in-progress': '#6366f1', done: '#22c55e', rejected: '#ef4444' };
const TYPE_COLORS = { requirement: '#6366f1', update: '#00B4CC', feedback: '#1dbf73', link: '#f59e0b', reference: '#94a3b8', approval: '#ec4899', content: '#8b5cf6', revision: '#ef4444' };
const STATUSES = ['pending', 'acknowledged', 'in-progress', 'done', 'rejected'];

export default function AdminRequirements() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/requirements/admin/all?limit=100');
      setRequirements(data.requirements || []);
    } catch { toast.error('Failed to load requirements.'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (id, status) => {
    setUpdatingStatus(id);
    try {
      const { data } = await api.patch(`/requirements/${id}/status`, { status });
      setRequirements(r => r.map(x => x._id === id ? data.requirement : x));
      if (selected?._id === id) setSelected(data.requirement);
      toast.success('Status updated.');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
    setUpdatingStatus(null);
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setReplying(true);
    try {
      const { data } = await api.post(`/requirements/${selected._id}/reply`, { message: reply });
      setRequirements(r => r.map(x => x._id === selected._id ? data.requirement : x));
      setSelected(data.requirement);
      setReply('');
      toast.success('Reply sent.');
    } catch (err) { toast.error(err.response?.data?.message || 'Reply failed.'); }
    setReplying(false);
  };

  const filtered = filterStatus ? requirements.filter(r => r.status === filterStatus) : requirements;

  return (
    <AdminLayout title="Requirements" subtitle="View and manage client and team requirements.">
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{ padding: '7px 16px', borderRadius: 50, border: `1.5px solid ${filterStatus === s ? '#00B4CC' : '#e2e8f0'}`, background: filterStatus === s ? '#00B4CC' : '#fff', color: filterStatus === s ? '#fff' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit' }}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#94a3b8', alignSelf: 'center' }}>{filtered.length} items</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.4fr' : '1fr', gap: 16, alignItems: 'start' }}>
        {/* List */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>No requirements found.</div>
          ) : filtered.map((r, i) => (
            <div key={r._id}
              onClick={() => setSelected(selected?._id === r._id ? null : r)}
              style={{ padding: '16px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', background: selected?._id === r._id ? '#f0fdff' : '#fff', borderLeft: selected?._id === r._id ? '3px solid #00B4CC' : '3px solid transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.875rem', flex: 1, marginRight: 10 }}>{r.title}</div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${STATUS_COLORS[r.status]}18`, color: STATUS_COLORS[r.status], flexShrink: 0 }}>
                  {r.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, background: `${TYPE_COLORS[r.type]}18`, color: TYPE_COLORS[r.type], padding: '1px 7px', borderRadius: 10 }}>{r.type}</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.user?.name}</span>
                <span style={{ fontSize: '0.68rem', color: r.raisedByRole === 'team' ? '#00B4CC' : '#1dbf73', background: r.raisedByRole === 'team' ? 'rgba(0,180,204,0.08)' : 'rgba(29,191,115,0.08)', padding: '1px 7px', borderRadius: 10 }}>
                  by {r.raisedByRole}
                </span>
                {r.order?.posHead && (
                  <span style={{ fontSize: '0.62rem', color: '#0369a1', background: '#e0f2fe', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>
                    <i className="fas fa-user-tie" style={{ marginRight: 3 }} />{r.order.posHead.name}
                  </span>
                )}
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: 'auto' }}>
                  {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              {r.dueDate && (
                <div style={{ fontSize: '0.68rem', color: '#f59e0b', marginTop: 4 }}>
                  <i className="fas fa-clock" style={{ marginRight: 4 }} />Due: {new Date(r.dueDate).toLocaleDateString('en-IN')}
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
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Client: <strong>{selected.user?.name}</strong> · Raised by: <strong>{selected.raisedBy?.name}</strong> ({selected.raisedByRole})
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, background: `${STATUS_COLORS[selected.status]}18`, color: STATUS_COLORS[selected.status], padding: '3px 10px', borderRadius: 20 }}>{selected.status}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, background: `${TYPE_COLORS[selected.type]}18`, color: TYPE_COLORS[selected.type], padding: '3px 10px', borderRadius: 20 }}>{selected.type}</span>
              {selected.order && <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: 20 }}>Order: {selected.order.invoiceNumber || selected.order.planName}</span>}
            </div>

            {selected.description && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{selected.description}</p>
              </div>
            )}

            {selected.links?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Links</div>
                {selected.links.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noreferrer"
                    style={{ display: 'block', color: '#00B4CC', fontSize: '0.82rem', textDecoration: 'none', marginBottom: 4 }}>
                    <i className="fas fa-link" style={{ marginRight: 6 }} />{l.label || l.url}
                  </a>
                ))}
              </div>
            )}

            {/* Status buttons */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Change Status</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => handleStatusChange(selected._id, s)} disabled={updatingStatus === selected._id || selected.status === s}
                    style={{ padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${selected.status === s ? STATUS_COLORS[s] : '#e2e8f0'}`, background: selected.status === s ? `${STATUS_COLORS[s]}18` : '#fff', color: selected.status === s ? STATUS_COLORS[s] : '#64748b', fontWeight: 600, cursor: selected.status === s ? 'default' : 'pointer', fontSize: '0.72rem', fontFamily: 'inherit' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Replies */}
            {selected.replies?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>Replies</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                  {selected.replies.map((r, i) => (
                    <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', borderLeft: '3px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: 4 }}>
                        {r.sender?.name || 'User'} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151' }}>{r.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply box */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Add Reply</label>
              <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Reply to this requirement…" rows={3}
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
