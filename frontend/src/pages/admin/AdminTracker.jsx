import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AdminLayout } from './AdminDashboard.jsx';
import api from '../../api/axios.js';

const STATUS_OPTS = ['not-started', 'in-progress', 'review', 'completed', 'on-hold'];
const STATUS_COLORS = { 'not-started': '#64748b', 'in-progress': '#f59e0b', review: '#00B4CC', completed: '#1dbf73', 'on-hold': '#ef4444' };

export default function AdminTracker() {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [updateForm, setUpdateForm] = useState({ title: '', description: '', status: 'in-progress', overallStatus: '', progressPercent: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTrackers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/tracker/all', { params });
      setTrackers(data.trackers || []);
    } catch { toast.error('Failed to load trackers.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTrackers(); }, [statusFilter]);

  const viewDetail = async (tracker) => {
    try {
      const { data } = await api.get(`/tracker/${tracker._id}`);
      setSelected(data.tracker);
      setUpdateForm({ title: '', description: '', status: 'in-progress', overallStatus: data.tracker.overallStatus, progressPercent: data.tracker.progressPercent });
    } catch { toast.error('Failed to load tracker details.'); }
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    if (!updateForm.title.trim() || !updateForm.description.trim()) { toast.error('Title and description are required.'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/tracker/${selected._id}/update`, updateForm);
      setSelected(data.tracker);
      setUpdateForm(f => ({ ...f, title: '', description: '' }));
      toast.success('Update added successfully.');
      fetchTrackers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add update.'); }
    finally { setSubmitting(false); }
  };

  return (
    <AdminLayout title="Service Tracker" subtitle="Manage and update service progress for all clients.">
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', ...STATUS_OPTS].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${s && STATUS_COLORS[s] ? STATUS_COLORS[s] : 'var(--border-color)'}`, background: statusFilter === s ? (STATUS_COLORS[s] || 'var(--dark-blue)') : '#fff', color: statusFilter === s ? '#fff' : 'var(--text-main)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
            {s ? s.replace('-', ' ') : 'All'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20 }}>
        {/* Tracker List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : trackers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>No trackers found.</div>
          ) : trackers.map(tracker => (
            <div key={tracker._id} onClick={() => viewDetail(tracker)}
              style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: `1px solid ${selected?._id === tracker._id ? 'var(--secondary-color)' : 'var(--border-color)'}`, cursor: 'pointer', transition: 'all 0.2s', boxShadow: selected?._id === tracker._id ? 'var(--shadow-md)' : 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(0,180,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-color)', fontSize: '1.2rem', flexShrink: 0 }}>
                <i className={tracker.service?.icon || 'fas fa-star'}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.9rem', marginBottom: 2 }}>{tracker.service?.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{tracker.user?.name} · {tracker.order?.planName}</div>
                {/* POS head + team members row */}
                <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                  {tracker.order?.posHead ? (
                    <span style={{ fontSize: '0.68rem', color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                      <i className="fas fa-user-tie" style={{ marginRight: 4 }} />{tracker.order.posHead.name}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 20 }}>No head assigned</span>
                  )}
                  {tracker.order?.teamMembers?.length > 0 && (
                    <span style={{ fontSize: '0.68rem', color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                      <i className="fas fa-users" style={{ marginRight: 4 }} />{tracker.order.teamMembers.length} members
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Progress</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--secondary-color)' }}>{tracker.progressPercent}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-light)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${tracker.progressPercent}%`, background: 'var(--gradient-primary)', borderRadius: 2 }} />
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: `${STATUS_COLORS[tracker.overallStatus]}18`, color: STATUS_COLORS[tracker.overallStatus], padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>
                  {tracker.overallStatus?.replace('-', ' ')}
                </span>
                {tracker.assignedTo && <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: 4 }}>→ {tracker.assignedTo?.name}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Detail & Update Panel */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <div>
                <h3 style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.95rem' }}>{selected.service?.title}</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{selected.user?.name} · {selected.user?.email}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '1.3rem' }}>×</button>
            </div>

            {/* Add Update Form */}
            <form onSubmit={submitUpdate} style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h4 style={{ fontWeight: 700, color: 'var(--dark-blue)', marginBottom: 14 }}>Add Progress Update</h4>
              <div className="form-field" style={{ marginBottom: 12 }}>
                <label>Update Title</label>
                <input type="text" placeholder="e.g. Keyword Research Completed" value={updateForm.title}
                  onChange={e => setUpdateForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-field" style={{ marginBottom: 12 }}>
                <label>Description</label>
                <textarea rows={3} placeholder="Describe what was done..."
                  value={updateForm.description} onChange={e => setUpdateForm(f => ({ ...f, description: e.target.value }))} required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
              </div>
              <div className="form-group-row" style={{ marginBottom: 12 }}>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label>Overall Status</label>
                  <select value={updateForm.overallStatus} onChange={e => setUpdateForm(f => ({ ...f, overallStatus: e.target.value }))}>
                    {STATUS_OPTS.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.replace('-', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label>Progress %</label>
                  <input type="number" min={0} max={100} value={updateForm.progressPercent}
                    onChange={e => setUpdateForm(f => ({ ...f, progressPercent: Number(e.target.value) }))} />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn btn-consult" style={{ width: '100%', gap: 8 }}>
                {submitting ? <><span className="spinner-sm" /> Posting...</> : <><i className="fas fa-plus-circle"></i> Post Update</>}
              </button>
            </form>

            {/* Timeline */}
            <div style={{ padding: '20px 24px' }}>
              <h4 style={{ fontWeight: 700, color: 'var(--dark-blue)', marginBottom: 16 }}>Update History ({selected.updates?.length || 0})</h4>
              {[...(selected.updates || [])].reverse().map((update, i) => (
                <div key={update._id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem' }}>
                      <i className="fas fa-check"></i>
                    </div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-light)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.875rem' }}>{update.title}</div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.8rem', margin: '4px 0' }}>{update.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                        {update.updatedBy?.name && `By ${update.updatedBy.name} · `}
                        {new Date(update.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!update.isVisibleToUser && (
                        <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 600, background: '#fef9c3', padding: '2px 6px', borderRadius: 4 }}>Internal</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
