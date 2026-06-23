import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AdminLayout } from './AdminDashboard.jsx';
import api from '../../api/axios.js';

const CATEGORIES = ['e-commerce', 'marketing', 'design-development'];
const CAT_LABELS = { 'e-commerce': 'E-Commerce', 'marketing': 'Marketing', 'design-development': 'Design & Dev' };
const CAT_COLORS = { 'e-commerce': '#f59e0b', 'marketing': '#00B4CC', 'design-development': '#8b5cf6' };

const EMPTY_PLAN = { name: '', price: '', duration: '1 month', features: '', isPopular: false };
const EMPTY_FORM = { title: '', slug: '', description: '', shortDesc: '', icon: 'fas fa-star', category: 'e-commerce', startingPrice: '', order: 0, isActive: true, plans: [] };

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/services');
      setServices(data.services || []);
    } catch { toast.error('Failed to load services.'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY_FORM, plans: [] }); setShowForm(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      title: s.title, slug: s.slug, description: s.description, shortDesc: s.shortDesc || '',
      icon: s.icon, category: s.category, startingPrice: s.startingPrice, order: s.order || 0,
      isActive: s.isActive,
      plans: s.plans.map(p => ({ ...p, features: (p.features || []).join('\n'), _id: p._id })),
    });
    setShowForm(true);
  };

  const set = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    if (k === 'title' && !editing) next.slug = toSlug(v);
    return next;
  });

  const setPlan = (i, k, v) => setForm(f => {
    const plans = [...f.plans];
    plans[i] = { ...plans[i], [k]: v };
    return { ...f, plans };
  });

  const addPlan = () => setForm(f => ({ ...f, plans: [...f.plans, { ...EMPTY_PLAN }] }));
  const removePlan = (i) => setForm(f => ({ ...f, plans: f.plans.filter((_, idx) => idx !== i) }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.startingPrice) {
      return toast.error('Title, description and starting price are required.');
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        startingPrice: Number(form.startingPrice),
        plans: form.plans.map(p => ({
          ...p,
          price: Number(p.price),
          features: p.features.split('\n').map(f => f.trim()).filter(Boolean),
        })),
      };
      if (editing) {
        const { data } = await api.put(`/services/${editing._id}`, payload);
        setServices(s => s.map(x => x._id === editing._id ? data.service : x));
        toast.success('Service updated!');
      } else {
        const { data } = await api.post('/services', payload);
        setServices(s => [...s, data.service]);
        toast.success('Service created!');
      }
      setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed.'); }
    setSaving(false);
  };

  const handleDeactivate = async (s) => {
    const msg = s.isActive ? 'Deactivate this service? It will be hidden from clients.' : 'Reactivate this service?';
    if (!window.confirm(msg)) return;
    try {
      if (s.isActive) {
        await api.delete(`/services/${s._id}`);
        setServices(sv => sv.map(x => x._id === s._id ? { ...x, isActive: false } : x));
        toast.success('Service deactivated.');
      } else {
        const { data } = await api.put(`/services/${s._id}`, { isActive: true });
        setServices(sv => sv.map(x => x._id === s._id ? data.service : x));
        toast.success('Service reactivated.');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  return (
    <AdminLayout title="Services" subtitle="Manage service offerings, plans, and pricing.">
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={openNew}
          style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          <i className="fas fa-plus" style={{ marginRight: 8 }} />Add Service
        </button>
      </div>

      {/* Service grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : services.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>No services yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {services.map(s => (
            <div key={s._id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px', opacity: s.isActive ? 1 : 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${CAT_COLORS[s.category]}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CAT_COLORS[s.category] }}>
                    <i className={s.icon} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' }}>{s.title}</div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, background: `${CAT_COLORS[s.category]}18`, color: CAT_COLORS[s.category], padding: '2px 8px', borderRadius: 20 }}>{CAT_LABELS[s.category]}</span>
                  </div>
                </div>
                {!s.isActive && <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: 20 }}>Inactive</span>}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>{s.shortDesc || s.description.slice(0, 90)}…</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 800, color: '#1dbf73', fontSize: '1rem' }}>₹{s.startingPrice?.toLocaleString('en-IN')}<span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8' }}>/mo</span></span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.plans?.length || 0} plans</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(s)}
                  style={{ flex: 1, padding: '8px', background: 'rgba(0,180,204,0.08)', border: '1px solid rgba(0,180,204,0.2)', borderRadius: 8, color: '#00B4CC', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit' }}>
                  <i className="fas fa-edit" style={{ marginRight: 4 }} />Edit
                </button>
                <button onClick={() => handleDeactivate(s)}
                  style={{ flex: 1, padding: '8px', background: s.isActive ? 'rgba(239,68,68,0.08)' : 'rgba(29,191,115,0.08)', border: `1px solid ${s.isActive ? 'rgba(239,68,68,0.2)' : 'rgba(29,191,115,0.2)'}`, borderRadius: 8, color: s.isActive ? '#ef4444' : '#1dbf73', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit' }}>
                  <i className={`fas ${s.isActive ? 'fa-eye-slash' : 'fa-eye'}`} style={{ marginRight: 4 }} />{s.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', width: '100%', maxWidth: 760, margin: '0 auto 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, color: '#1a1a2e', margin: 0 }}>{editing ? 'Edit Service' : 'Add Service'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Basic info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Title *</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Amazon Management" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Slug *</label>
                  <input value={form.slug} onChange={e => set('slug', toSlug(e.target.value))} placeholder="amazon-management" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Description *</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Full service description…" rows={3} style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div>
                <label style={lbl}>Short Description (for cards)</label>
                <input value={form.shortDesc} onChange={e => set('shortDesc', e.target.value)} placeholder="One-line summary…" style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Category *</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} style={inp}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Starting Price (₹)</label>
                  <input type="number" value={form.startingPrice} onChange={e => set('startingPrice', e.target.value)} placeholder="2999" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Icon (FA class)</label>
                  <input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="fas fa-star" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Sort Order</label>
                  <input type="number" value={form.order} onChange={e => set('order', Number(e.target.value))} style={inp} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} style={{ width: 16, height: 16 }} />
                <label htmlFor="isActive" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Active (visible to clients)</label>
              </div>

              {/* Plans */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ ...lbl, margin: 0 }}>Plans ({form.plans.length})</label>
                  <button type="button" onClick={addPlan}
                    style={{ padding: '6px 14px', background: 'rgba(0,180,204,0.08)', border: '1px solid rgba(0,180,204,0.2)', borderRadius: 8, color: '#00B4CC', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit' }}>
                    <i className="fas fa-plus" style={{ marginRight: 4 }} />Add Plan
                  </button>
                </div>
                {form.plans.map((p, i) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: 12, padding: '16px', marginBottom: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1a1a2e' }}>Plan {i + 1}</span>
                      <button type="button" onClick={() => removePlan(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem' }}>
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={lbl}>Name</label>
                        <input value={p.name} onChange={e => setPlan(i, 'name', e.target.value)} placeholder="Basic" style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Price (₹)</label>
                        <input type="number" value={p.price} onChange={e => setPlan(i, 'price', e.target.value)} placeholder="2999" style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Duration</label>
                        <input value={p.duration} onChange={e => setPlan(i, 'duration', e.target.value)} placeholder="1 month" style={inp} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={lbl}>Features (one per line)</label>
                      <textarea value={p.features} onChange={e => setPlan(i, 'features', e.target.value)} placeholder="50 SKU listings&#10;Keyword updates&#10;…" rows={4} style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" id={`popular-${i}`} checked={p.isPopular} onChange={e => setPlan(i, 'isPopular', e.target.checked)} style={{ width: 14, height: 14 }} />
                      <label htmlFor={`popular-${i}`} style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Mark as Popular</label>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 28px', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Create Service')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const lbl = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' };
const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
