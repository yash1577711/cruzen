import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AdminLayout } from './AdminDashboard.jsx';
import api from '../../api/axios.js';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const STATUS_COLORS = { pending: '#f59e0b', confirmed: '#00B4CC', completed: '#1dbf73', cancelled: '#ef4444' };

export default function AdminConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/consultations', { params });
      setConsultations(data.consultations || []);
    } catch { toast.error('Failed to load consultations.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConsultations(); }, [statusFilter]);

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      const { data } = await api.patch(`/consultations/${id}`, { status });
      setConsultations(prev => prev.map(c => c._id === id ? data.consultation : c));
      if (selected?._id === id) setSelected(data.consultation);
      toast.success(`Consultation marked as ${status}.`);
    } catch { toast.error('Failed to update consultation.'); }
    finally { setUpdating(false); }
  };

  const statCounts = STATUSES.map(s => ({ s, count: consultations.filter(c => c.status === s).length }));

  return (
    <AdminLayout title="Consultations" subtitle="View and manage all booked consultation requests.">
      {/* Status Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {statCounts.map(({ s, count }) => (
          <div key={s} style={{ background: '#fff', borderRadius: 10, padding: '12px 20px', border: `1px solid ${STATUS_COLORS[s]}30`, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.2s', boxShadow: statusFilter === s ? 'var(--shadow-md)' : 'none' }}
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s], display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark-blue)', textTransform: 'capitalize' }}>{s}</span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: STATUS_COLORS[s] }}>{count}</span>
          </div>
        ))}
        {statusFilter && (
          <button onClick={() => setStatusFilter('')}
            style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 10, padding: '12px 20px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', cursor: 'pointer' }}>
            Clear Filter ×
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 20 }}>
        {/* Consultations List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : consultations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-light)', background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)' }}>
              <i className="fas fa-calendar-times" style={{ fontSize: '2.5rem', opacity: 0.3, display: 'block', marginBottom: 12 }}></i>
              No consultations found.
            </div>
          ) : consultations.map(c => (
            <div key={c._id} onClick={() => setSelected(sel => sel?._id === c._id ? null : c)}
              style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: `1px solid ${selected?._id === c._id ? 'var(--secondary-color)' : 'var(--border-color)'}`, cursor: 'pointer', transition: 'all 0.2s', boxShadow: selected?._id === c._id ? 'var(--shadow-md)' : 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Calendar Icon */}
              <div style={{ width: 52, height: 52, borderRadius: 10, background: `${STATUS_COLORS[c.status]}15`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${STATUS_COLORS[c.status]}40` }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: STATUS_COLORS[c.status], lineHeight: 1 }}>
                  {c.date ? new Date(c.date).getDate() : '?'}
                </span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: STATUS_COLORS[c.status], textTransform: 'uppercase' }}>
                  {c.date ? new Date(c.date).toLocaleString('en-IN', { month: 'short' }) : '—'}
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.9rem', marginBottom: 2 }}>{c.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 4 }}>{c.email} {c.phone && `· ${c.phone}`}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {c.service && (
                    <span style={{ background: 'rgba(2,43,80,0.06)', color: 'var(--dark-blue)', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 }}>
                      {c.service}
                    </span>
                  )}
                  {c.timeSlot && (
                    <span style={{ background: 'rgba(0,180,204,0.08)', color: 'var(--secondary-color)', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 }}>
                      <i className="fas fa-clock" style={{ marginRight: 4 }}></i>{c.timeSlot}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ background: `${STATUS_COLORS[c.status]}18`, color: STATUS_COLORS[c.status], padding: '5px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                  {c.status}
                </span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', textAlign: 'right', marginTop: 6 }}>
                  {new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', height: 'fit-content', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.95rem' }}>Consultation Details</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '1.2rem' }}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              {/* Client Info */}
              <div style={{ background: 'var(--bg-light)', borderRadius: 10, padding: '16px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                    {selected.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--dark-blue)' }}>{selected.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{selected.email}</div>
                  </div>
                </div>
                {selected.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}><i className="fas fa-phone" style={{ color: 'var(--secondary-color)', marginRight: 8, width: 16 }}></i>{selected.phone}</div>}
              </div>

              {/* Appointment */}
              <div style={{ background: 'rgba(0,180,204,0.06)', border: '1px solid rgba(0,180,204,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--secondary-color)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Appointment</div>
                <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.9rem' }}>
                  {selected.date ? new Date(selected.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Date not set'}
                </div>
                {selected.timeSlot && <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginTop: 4 }}><i className="fas fa-clock" style={{ marginRight: 6, color: 'var(--secondary-color)' }}></i>{selected.timeSlot}</div>}
              </div>

              {selected.service && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Requested Service</div>
                  <div style={{ fontWeight: 600, color: 'var(--dark-blue)' }}>{selected.service}</div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Update Status</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {STATUSES.map(s => (
                    <button key={s} disabled={updating || selected.status === s} onClick={() => updateStatus(selected._id, s)}
                      style={{ padding: '10px', borderRadius: 8, border: `1px solid ${STATUS_COLORS[s]}`, background: selected.status === s ? STATUS_COLORS[s] : `${STATUS_COLORS[s]}12`, color: selected.status === s ? '#fff' : STATUS_COLORS[s], fontWeight: 700, fontSize: '0.8rem', cursor: selected.status === s ? 'default' : 'pointer', textTransform: 'capitalize', transition: 'all 0.2s', opacity: updating ? 0.7 : 1 }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center' }}>
                Booked {new Date(selected.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
