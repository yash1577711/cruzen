import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AdminLayout } from './AdminDashboard.jsx';
import api from '../../api/axios.js';

const SERVICE_CATEGORIES = [
  { value: 'e-commerce', label: 'E-Commerce' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design-development', label: 'Design & Development' },
];

const ROLE_COLORS = { pos_head: { bg: '#e0f2fe', color: '#0369a1' }, team_member: { bg: '#dcfce7', color: '#166534' }, 'sub-admin': { bg: '#f3e8ff', color: '#7e22ce' } };

const CAT_COLORS = { 'e-commerce': '#f59e0b', marketing: '#6366f1', 'design-development': '#ec4899' };

const INIT_FORM = { name: '', email: '', phone: '', password: '', role: 'pos_head', department: '', designation: '', serviceCategories: [], managedBy: '' };

export default function AdminStaff() {
  const [tab, setTab] = useState('pos_head');
  const [staff, setStaff] = useState([]);
  const [posHeads, setPosHeads] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editCategories, setEditCategories] = useState([]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const [staffRes, subRes] = await Promise.all([
        api.get('/admin/staff'),
        api.get('/admin/sub-admins'),
      ]);
      const allStaff = staffRes.data.staff || [];
      setStaff(allStaff);
      setPosHeads(allStaff.filter(s => s.role === 'pos_head'));
      setSubAdmins(subRes.data.subAdmins || []);
    } catch { toast.error('Failed to load staff.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadStaff(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const toggleCategory = (cat) => {
    setForm(f => ({
      ...f,
      serviceCategories: f.serviceCategories.includes(cat)
        ? f.serviceCategories.filter(c => c !== cat)
        : [...f.serviceCategories, cat],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Name, email and password required.'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    if (form.role === 'pos_head' && !form.serviceCategories.length) { toast.error('Select at least one service category for POS head.'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/admin/staff', form);
      toast.success(`${form.role === 'pos_head' ? 'POS Head' : 'Team Member'} created successfully.`);
      setStaff(prev => [data.user, ...prev]);
      if (data.user.role === 'pos_head') setPosHeads(prev => [data.user, ...prev]);
      setForm(INIT_FORM);
      setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create staff.'); }
    finally { setSubmitting(false); }
  };

  const handleToggleActive = async (id, current) => {
    try {
      const { data } = await api.patch(`/admin/staff/${id}`, { isActive: !current });
      setStaff(prev => prev.map(s => s._id === id ? { ...s, ...data.user } : s));
      if (data.user.role === 'pos_head') setPosHeads(prev => prev.map(s => s._id === id ? { ...s, ...data.user } : s));
      toast.success(`Staff ${!current ? 'activated' : 'deactivated'}.`);
    } catch { toast.error('Failed to update.'); }
  };

  const openEdit = (member) => {
    setEditing(member);
    setEditCategories(member.serviceCategories || []);
  };

  const saveCategories = async () => {
    try {
      const { data } = await api.patch(`/admin/staff/${editing._id}`, { serviceCategories: editCategories });
      setStaff(prev => prev.map(s => s._id === editing._id ? { ...s, ...data.user } : s));
      setPosHeads(prev => prev.map(s => s._id === editing._id ? { ...s, ...data.user } : s));
      setEditing(null);
      toast.success('Categories updated.');
    } catch { toast.error('Failed to update categories.'); }
  };

  const filtered = tab === 'sub-admin' ? subAdmins : staff.filter(s => s.role === tab);

  const tabStyle = (t) => ({
    padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    background: tab === t ? 'var(--gradient-primary)' : '#fff',
    color: tab === t ? '#fff' : 'var(--text-light)',
    boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
    border: tab === t ? 'none' : '1px solid var(--border-color)',
  });

  return (
    <AdminLayout title="Staff Management" subtitle="Create and manage POS Heads, Team Members, and Sub-Admins.">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button style={tabStyle('pos_head')} onClick={() => { setTab('pos_head'); setShowForm(false); }}>
          <i className="fas fa-user-tie" style={{ marginRight: 6 }} />POS Heads ({staff.filter(s => s.role === 'pos_head').length})
        </button>
        <button style={tabStyle('team_member')} onClick={() => { setTab('team_member'); setShowForm(false); }}>
          <i className="fas fa-users" style={{ marginRight: 6 }} />Team Members ({staff.filter(s => s.role === 'team_member').length})
        </button>
        <button style={tabStyle('sub-admin')} onClick={() => { setTab('sub-admin'); setShowForm(false); }}>
          <i className="fas fa-user-shield" style={{ marginRight: 6 }} />Sub-Admins ({subAdmins.length})
        </button>
        <button onClick={() => { setShowForm(v => !v); setForm({ ...INIT_FORM, role: tab === 'sub-admin' ? 'pos_head' : tab }); }}
          className="btn btn-consult" style={{ marginLeft: 'auto', gap: 8 }}>
          <i className={`fas fa-${showForm ? 'times' : 'plus'}`}></i>
          {showForm ? 'Cancel' : `Add ${tab === 'pos_head' ? 'POS Head' : tab === 'team_member' ? 'Team Member' : 'Sub-Admin'}`}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '28px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, color: 'var(--dark-blue)', marginBottom: 20 }}>
            Create New {form.role === 'pos_head' ? 'POS Head' : 'Team Member'}
          </h3>
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
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                    <i className={`fas fa-eye${showPw ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="form-group-row">
              <div className="form-field">
                <label>Role *</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="pos_head">POS Head (Department Head)</option>
                  <option value="team_member">Team Member</option>
                </select>
              </div>
              <div className="form-field">
                <label>Department</label>
                <input type="text" name="department" value={form.department} onChange={handleChange} placeholder="e.g. E-Commerce, Marketing" />
              </div>
            </div>
            <div className="form-group-row">
              <div className="form-field">
                <label>Designation</label>
                <input type="text" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Senior Manager" />
              </div>
              {form.role === 'team_member' && (
                <div className="form-field">
                  <label>Assign to POS Head</label>
                  <select name="managedBy" value={form.managedBy} onChange={handleChange}>
                    <option value="">— None —</option>
                    {posHeads.map(h => <option key={h._id} value={h._id}>{h.name} ({h.department || h.serviceCategories?.join(', ') || 'No category'})</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Service Categories */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Service Categories {form.role === 'pos_head' && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {SERVICE_CATEGORIES.map(cat => {
                  const active = form.serviceCategories.includes(cat.value);
                  return (
                    <button key={cat.value} type="button" onClick={() => toggleCategory(cat.value)}
                      style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${active ? CAT_COLORS[cat.value] : 'var(--border-color)'}`, background: active ? `${CAT_COLORS[cat.value]}18` : '#fff', color: active ? CAT_COLORS[cat.value] : 'var(--text-light)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.15s' }}>
                      {active && <i className="fas fa-check" style={{ marginRight: 6, fontSize: '0.7rem' }} />}{cat.label}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 6 }}>
                {form.role === 'pos_head' ? 'POS Head will be available for orders in these categories.' : 'Optional — filter what this member can see.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={submitting} className="btn btn-consult" style={{ gap: 8 }}>
                {submitting ? <><span className="spinner-sm" /> Creating...</> : <><i className="fas fa-user-plus"></i> Create</>}
              </button>
              <button type="button" onClick={() => { setForm(INIT_FORM); setShowForm(false); }}
                style={{ padding: '10px 24px', border: '1px solid var(--border-color)', borderRadius: 8, background: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Categories Modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--dark-blue)', marginBottom: 6 }}>Edit Categories</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: 20 }}>{editing.name}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
              {SERVICE_CATEGORIES.map(cat => {
                const active = editCategories.includes(cat.value);
                return (
                  <button key={cat.value} type="button"
                    onClick={() => setEditCategories(prev => active ? prev.filter(c => c !== cat.value) : [...prev, cat.value])}
                    style={{ padding: '10px 18px', borderRadius: 10, border: `2px solid ${active ? CAT_COLORS[cat.value] : 'var(--border-color)'}`, background: active ? `${CAT_COLORS[cat.value]}18` : '#fff', color: active ? CAT_COLORS[cat.value] : 'var(--text-light)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                    {active && <i className="fas fa-check" style={{ marginRight: 6 }} />}{cat.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveCategories} className="btn btn-consult" style={{ flex: 1 }}>Save</button>
              <button onClick={() => setEditing(null)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border-color)', borderRadius: 8, background: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
            <i className="fas fa-users" style={{ fontSize: '2.5rem', opacity: 0.3, display: 'block', marginBottom: 12 }}></i>
            <p style={{ fontWeight: 600 }}>No {tab === 'pos_head' ? 'POS heads' : tab === 'team_member' ? 'team members' : 'sub-admins'} yet.</p>
            <p style={{ fontSize: '0.85rem' }}>Click "Add" button to create one.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)', borderBottom: '1px solid var(--border-color)' }}>
                {['Staff Member', 'Contact', tab === 'pos_head' ? 'Categories / Orders' : 'Manager / Categories', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const rc = ROLE_COLORS[u.role] || ROLE_COLORS['sub-admin'];
                return (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-light)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.875rem' }}>{u.name}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, background: rc.bg, color: rc.color, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                              {u.role === 'pos_head' ? 'POS Head' : u.role === 'team_member' ? 'Team Member' : 'Sub-Admin'}
                            </span>
                            {u.designation && <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', background: '#f1f5f9', padding: '2px 7px', borderRadius: 20 }}>{u.designation}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{u.email}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{u.phone || '—'}</div>
                      {u.department && <div style={{ fontSize: '0.72rem', color: 'var(--secondary-color)', fontWeight: 600 }}>{u.department}</div>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {tab === 'pos_head' ? (
                        <div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                            {(u.serviceCategories || []).length === 0 ? (
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>No categories assigned</span>
                            ) : (u.serviceCategories || []).map(cat => (
                              <span key={cat} style={{ fontSize: '0.65rem', fontWeight: 700, background: `${CAT_COLORS[cat]}18`, color: CAT_COLORS[cat], padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>
                                {cat}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: 'var(--text-light)' }}>
                            {u.memberCount !== undefined && <span><i className="fas fa-users" style={{ marginRight: 4 }} />{u.memberCount} members</span>}
                            {u.activeOrders !== undefined && <span><i className="fas fa-briefcase" style={{ marginRight: 4 }} />{u.activeOrders} orders</span>}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {u.managedBy ? (
                            <div style={{ fontSize: '0.82rem', color: 'var(--dark-blue)', fontWeight: 600, marginBottom: 4 }}>
                              <i className="fas fa-user-tie" style={{ marginRight: 4, color: 'var(--secondary-color)' }} />{u.managedBy?.name || 'Assigned Head'}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 4 }}>No manager assigned</div>
                          )}
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(u.serviceCategories || []).map(cat => (
                              <span key={cat} style={{ fontSize: '0.62rem', fontWeight: 700, background: `${CAT_COLORS[cat]}18`, color: CAT_COLORS[cat], padding: '2px 6px', borderRadius: 20 }}>{cat}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#16a34a' : '#dc2626', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {u.role === 'pos_head' && (
                          <button onClick={() => openEdit(u)}
                            style={{ background: 'rgba(0,180,204,0.1)', border: 'none', color: 'var(--secondary-color)', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>
                            <i className="fas fa-tag" style={{ marginRight: 4 }} />Categories
                          </button>
                        )}
                        {tab !== 'sub-admin' && (
                          <button onClick={() => handleToggleActive(u._id, u.isActive)}
                            style={{ background: u.isActive ? '#fee2e2' : '#dcfce7', border: 'none', color: u.isActive ? '#dc2626' : '#16a34a', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Sub-admin info box */}
      {tab === 'sub-admin' && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(0,180,204,0.06)', border: '1px solid rgba(0,180,204,0.2)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-main)' }}>
          <i className="fas fa-info-circle" style={{ color: 'var(--secondary-color)', marginRight: 8 }} />
          Sub-admins are created from the <strong>Sub-Admins</strong> section (admin-only). They have access to manage leads, trackers, and consultations.
        </div>
      )}
    </AdminLayout>
  );
}
