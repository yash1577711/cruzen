import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AdminLayout } from './AdminDashboard.jsx';
import api from '../../api/axios.js';

const INIT_FORM = { name: '', email: '', phone: '', password: '' };

export default function AdminSubAdmins() {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const fetchSubAdmins = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/sub-admins');
      setSubAdmins(data.subAdmins || []);
    } catch { toast.error('Failed to load sub-admins.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSubAdmins(); }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Name, email and password are required.'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/admin/sub-admins', form);
      setSubAdmins(prev => [data.user, ...prev]);
      setForm(INIT_FORM);
      setShowForm(false);
      toast.success('Sub-admin created successfully.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create sub-admin.'); }
    finally { setSubmitting(false); }
  };

  const toggleActive = async (userId, current) => {
    try {
      const { data } = await api.patch(`/admin/users/${userId}`, { isActive: !current });
      setSubAdmins(prev => prev.map(u => u._id === userId ? data.user : u));
      toast.success(`Sub-admin ${!current ? 'activated' : 'deactivated'}.`);
    } catch { toast.error('Failed to update sub-admin.'); }
  };

  return (
    <AdminLayout title="Sub-Admins" subtitle="Manage staff who can update service trackers and manage leads.">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-consult" style={{ gap: 8 }}>
          <i className={`fas fa-${showForm ? 'times' : 'plus'}`}></i>
          {showForm ? 'Cancel' : 'Add Sub-Admin'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '28px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, color: 'var(--dark-blue)', marginBottom: 20 }}>Create New Sub-Admin</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group-row">
              <div className="form-field">
                <label>Full Name *</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Enter full name" required />
              </div>
              <div className="form-field">
                <label>Email Address *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter email" required />
              </div>
            </div>
            <div className="form-group-row">
              <div className="form-field">
                <label>Phone Number</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              </div>
              <div className="form-field">
                <label>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" required style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                    <i className={`fas fa-eye${showPw ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 16px', background: 'rgba(0,180,204,0.06)', border: '1px solid rgba(0,180,204,0.2)', borderRadius: 8, marginBottom: 20, fontSize: '0.825rem', color: 'var(--text-main)' }}>
              <i className="fas fa-info-circle" style={{ color: 'var(--secondary-color)', marginRight: 8 }}></i>
              Sub-admins can manage leads, update service trackers, and view consultations. Only the main admin can create or delete sub-admins.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={submitting} className="btn btn-consult" style={{ gap: 8 }}>
                {submitting ? <><span className="spinner-sm" /> Creating...</> : <><i className="fas fa-user-plus"></i> Create Sub-Admin</>}
              </button>
              <button type="button" onClick={() => { setForm(INIT_FORM); setShowForm(false); }}
                style={{ padding: '10px 24px', border: '1px solid var(--border-color)', borderRadius: 8, background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Admins List */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : subAdmins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
            <i className="fas fa-user-shield" style={{ fontSize: '2.5rem', color: 'var(--secondary-color)', opacity: 0.3, display: 'block', marginBottom: 12 }}></i>
            <p style={{ fontWeight: 600 }}>No sub-admins yet</p>
            <p style={{ fontSize: '0.85rem' }}>Create your first sub-admin to delegate management tasks.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)', borderBottom: '1px solid var(--border-color)' }}>
                {['Staff Member', 'Contact', 'Status', 'Login Count', 'Last Login', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subAdmins.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                        {u.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.9rem' }}>{u.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--secondary-color)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sub-Admin</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{u.email}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{u.phone || '—'}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#16a34a' : '#dc2626', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--dark-blue)', textAlign: 'center' }}>{u.loginCount || 0}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: 'var(--text-light)' }}>
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => toggleActive(u._id, u.isActive)}
                      style={{ background: u.isActive ? '#fee2e2' : '#dcfce7', border: 'none', color: u.isActive ? '#dc2626' : '#16a34a', padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
