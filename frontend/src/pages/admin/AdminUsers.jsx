import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AdminLayout } from './AdminDashboard.jsx';
import api from '../../api/axios.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const ROLES = ['user', 'pos_head', 'team_member', 'sub-admin', 'admin'];
const ROLE_LABELS = { user: 'Client', pos_head: 'POS Head', team_member: 'Team Member', 'sub-admin': 'Sub Admin', admin: 'Admin' };
const ROLE_COLORS = {
  user: { bg: '#f1f5f9', color: '#64748b' },
  pos_head: { bg: '#e0f2fe', color: '#0369a1' },
  team_member: { bg: '#dcfce7', color: '#166534' },
  'sub-admin': { bg: '#f3e8ff', color: '#7e22ce' },
  admin: { bg: '#fef9c3', color: '#854d0e' },
};
const SERVICE_CATEGORIES = [
  { value: 'e-commerce', label: 'E-Commerce', color: '#f59e0b' },
  { value: 'marketing', label: 'Marketing', color: '#6366f1' },
  { value: 'design-development', label: 'Design & Dev', color: '#ec4899' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [posHeads, setPosHeads] = useState([]);
  const [editRole, setEditRole] = useState('');
  const [editCategories, setEditCategories] = useState([]);
  const [editManager, setEditManager] = useState('');
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load users.'); }
    finally { setLoading(false); }
  };

  const fetchPosHeads = async () => {
    try {
      const { data } = await api.get('/admin/staff?role=pos_head');
      setPosHeads(data.staff || []);
    } catch {}
  };

  useEffect(() => { fetchUsers(); fetchPosHeads(); }, [roleFilter]);

  const openUser = async (user) => {
    setSelected(user);
    setEditRole(user.role);
    setEditCategories(user.serviceCategories || []);
    setEditManager(user.managedBy?._id || user.managedBy || '');
    try {
      const { data } = await api.get(`/admin/users/${user._id}/activity`);
      setUserActivity(data.activities || []);
    } catch { setUserActivity([]); }
  };

  const handleSaveRole = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // Update role
      await api.patch(`/admin/users/${selected._id}`, { role: editRole });
      // Update categories + manager via staff endpoint
      if (['pos_head', 'team_member'].includes(editRole)) {
        await api.patch(`/admin/staff/${selected._id}`, {
          serviceCategories: editCategories,
          managedBy: editManager || null,
        }).catch(() => {});
      }
      setUsers(prev => prev.map(u => u._id === selected._id ? { ...u, role: editRole, serviceCategories: editCategories } : u));
      setSelected(prev => ({ ...prev, role: editRole, serviceCategories: editCategories }));
      toast.success(`Role updated to ${ROLE_LABELS[editRole]}.`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update role.'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (userId, current) => {
    if (!isAdmin) { toast.error('Only admin can change user status.'); return; }
    try {
      const { data } = await api.patch(`/admin/users/${userId}`, { isActive: !current });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: data.user.isActive } : u));
      if (selected?._id === userId) setSelected(s => ({ ...s, isActive: data.user.isActive }));
      toast.success(`User ${!current ? 'activated' : 'deactivated'}.`);
    } catch { toast.error('Failed to update user.'); }
  };

  const toggleCat = (cat) => setEditCategories(prev =>
    prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
  );

  const allRoleFilters = ['', ...ROLES];

  return (
    <AdminLayout title="Users & Staff" subtitle={`${total} total accounts. Assign roles after users register.`}>

      {/* Info banner */}
      <div style={{ background: 'rgba(0,180,204,0.06)', border: '1px solid rgba(0,180,204,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <i className="fas fa-info-circle" style={{ color: 'var(--secondary-color)', fontSize: '1rem', flexShrink: 0 }} />
        <span>
          <strong>Staff flow:</strong> POS Heads and Team Members sign up normally at <code>/signup</code> or login via OTP.
          Admin then assigns their role + service categories here. Staff can use email/password or phone OTP to login.
        </span>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 20px', border: '1px solid var(--border-color)', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()}
          style={{ padding: '8px 14px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', minWidth: 240, flex: 1 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {allRoleFilters.map(r => {
            const rc = r ? ROLE_COLORS[r] : null;
            return (
              <button key={r} onClick={() => setRoleFilter(r)}
                style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${roleFilter === r ? (rc?.color || 'var(--dark-blue)') : 'var(--border-color)'}`, background: roleFilter === r ? (rc?.bg || 'var(--dark-blue)') : '#fff', color: roleFilter === r ? (rc?.color || '#fff') : 'var(--text-main)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                {r ? ROLE_LABELS[r] : 'All'}
              </button>
            );
          })}
        </div>
        <button className="btn btn-consult" style={{ padding: '8px 18px', fontSize: '0.85rem', flexShrink: 0 }} onClick={fetchUsers}>
          <i className="fas fa-search" style={{ marginRight: 6 }} />Search
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>No users found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-light)', borderBottom: '1px solid var(--border-color)' }}>
                  {['User', 'Contact', 'Role', 'Categories', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const rc = ROLE_COLORS[u.role] || ROLE_COLORS.user;
                  return (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)', background: selected?._id === u._id ? 'var(--bg-light)' : '' }}
                      onMouseEnter={e => { if (selected?._id !== u._id) e.currentTarget.style.background = '#fafafa'; }}
                      onMouseLeave={e => { if (selected?._id !== u._id) e.currentTarget.style.background = ''; }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>
                            {u.name?.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.85rem' }}>{u.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-main)' }}>{u.phone || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: rc.bg, color: rc.color, padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(u.serviceCategories || []).length > 0
                            ? u.serviceCategories.map(cat => {
                                const sc = SERVICE_CATEGORIES.find(s => s.value === cat);
                                return <span key={cat} style={{ fontSize: '0.62rem', fontWeight: 700, background: `${sc?.color || '#94a3b8'}18`, color: sc?.color || '#94a3b8', padding: '2px 6px', borderRadius: 10 }}>{sc?.label || cat}</span>;
                              })
                            : <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#16a34a' : '#dc2626', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => selected?._id === u._id ? setSelected(null) : openUser(u)}
                            style={{ background: selected?._id === u._id ? 'var(--dark-blue)' : 'rgba(0,180,204,0.1)', border: 'none', color: selected?._id === u._id ? '#fff' : 'var(--secondary-color)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>
                            {selected?._id === u._id ? 'Close' : 'Edit'}
                          </button>
                          {isAdmin && (
                            <button onClick={() => toggleActive(u._id, u.isActive)}
                              style={{ background: u.isActive ? '#fee2e2' : '#dcfce7', border: 'none', color: u.isActive ? '#dc2626' : '#16a34a', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>
                              {u.isActive ? 'Block' : 'Unblock'}
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

        {/* Edit Panel */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 80, maxHeight: '85vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                  {selected.name?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--dark-blue)', fontSize: '0.95rem' }}>{selected.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{selected.email}</div>
                  {selected.phone && <div style={{ fontSize: '0.72rem', color: 'var(--secondary-color)', fontWeight: 600 }}>{selected.phone}</div>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '1.1rem' }}>×</button>
            </div>

            <div style={{ padding: '18px 20px' }}>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, background: 'var(--bg-light)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: 'var(--dark-blue)', fontSize: '1.1rem' }}>{selected.loginCount || 0}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Logins</div>
                </div>
                <div style={{ flex: 2, background: 'var(--bg-light)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Last Login</div>
                  <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.8rem' }}>
                    {selected.lastLogin ? new Date(selected.lastLogin).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </div>
                </div>
              </div>

              {/* Role Assignment */}
              {isAdmin && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Assign Role</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {ROLES.map(r => {
                      const rc = ROLE_COLORS[r];
                      return (
                        <button key={r} onClick={() => setEditRole(r)}
                          style={{ padding: '7px 14px', borderRadius: 8, border: `2px solid ${editRole === r ? rc.color : 'var(--border-color)'}`, background: editRole === r ? rc.bg : '#fff', color: editRole === r ? rc.color : 'var(--text-light)', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.15s' }}>
                          {editRole === r && <i className="fas fa-check" style={{ marginRight: 5, fontSize: '0.65rem' }} />}{ROLE_LABELS[r]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Categories — only for pos_head */}
                  {editRole === 'pos_head' && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
                        Service Categories <span style={{ color: '#ef4444' }}>*</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {SERVICE_CATEGORIES.map(cat => {
                          const active = editCategories.includes(cat.value);
                          return (
                            <button key={cat.value} onClick={() => toggleCat(cat.value)}
                              style={{ padding: '8px 14px', borderRadius: 8, border: `2px solid ${active ? cat.color : 'var(--border-color)'}`, background: active ? `${cat.color}18` : '#fff', color: active ? cat.color : 'var(--text-light)', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', transition: 'all 0.15s' }}>
                              {active && <i className="fas fa-check" style={{ marginRight: 5, fontSize: '0.65rem' }} />}{cat.label}
                            </button>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: 6 }}>POS Head will only see orders from these categories.</p>
                    </div>
                  )}

                  {/* Manager — only for team_member */}
                  {editRole === 'team_member' && posHeads.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Assign to POS Head</div>
                      <select value={editManager} onChange={e => setEditManager(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.85rem', outline: 'none', background: '#fff' }}>
                        <option value="">— None —</option>
                        {posHeads.map(h => <option key={h._id} value={h._id}>{h.name} · {h.serviceCategories?.join(', ') || 'No category'}</option>)}
                      </select>
                    </div>
                  )}

                  <button onClick={handleSaveRole} disabled={saving || (editRole === 'pos_head' && editCategories.length === 0)}
                    className="btn btn-consult" style={{ width: '100%', justifyContent: 'center', gap: 8, opacity: (editRole === 'pos_head' && editCategories.length === 0) ? 0.5 : 1 }}>
                    {saving ? <><span className="spinner-sm" />Saving…</> : <><i className="fas fa-save" />Save Role</>}
                  </button>
                  {editRole === 'pos_head' && editCategories.length === 0 && (
                    <p style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 6, textAlign: 'center' }}>Select at least one category for POS Head.</p>
                  )}
                </div>
              )}

              {/* Activity log */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>Recent Activity</div>
                {userActivity.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center', padding: '12px 0' }}>No activity yet.</div>
                ) : userActivity.slice(0, 15).map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border-color)', alignItems: 'flex-start' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.type === 'login' ? '#1dbf73' : a.type === 'payment_success' ? '#1dbf73' : '#94a3b8', marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--dark-blue)', textTransform: 'capitalize' }}>{a.type?.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>{new Date(a.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
