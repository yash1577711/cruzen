import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AdminLayout } from './AdminDashboard.jsx';
import api from '../../api/axios.js';

const CATEGORIES = ['marketplace', 'design', 'marketing', 'branding', 'technology'];
const CAT_COLORS = { marketplace: '#f59e0b', design: '#8b5cf6', marketing: '#00B4CC', branding: '#ec4899', technology: '#6366f1' };
const EMPTY_FORM = { title: '', slug: '', excerpt: '', content: '', category: 'marketing', icon: 'fas fa-newspaper', readTime: '5 min read', tags: '', isPublished: true };

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export default function AdminBlog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [searchQ, setSearchQ] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/blog?limit=100');
      setBlogs(data.blogs || []);
    } catch { toast.error('Failed to load blogs.'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (b) => {
    setEditing(b);
    setForm({ title: b.title, slug: b.slug, excerpt: b.excerpt, content: b.content, category: b.category, icon: b.icon || 'fas fa-newspaper', readTime: b.readTime || '5 min read', tags: (b.tags || []).join(', '), isPublished: b.isPublished });
    setShowForm(true);
  };

  const set = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    if (k === 'title' && !editing) next.slug = toSlug(v);
    return next;
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim() || !form.excerpt.trim() || !form.content.trim()) {
      return toast.error('Title, slug, excerpt and content are required.');
    }
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (editing) {
        const { data } = await api.put(`/blog/${editing._id}`, payload);
        setBlogs(b => b.map(x => x._id === editing._id ? data.blog : x));
        toast.success('Blog updated!');
      } else {
        const { data } = await api.post('/blog', payload);
        setBlogs(b => [data.blog, ...b]);
        toast.success('Blog created!');
      }
      setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed.'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    setDeleting(id);
    try {
      await api.delete(`/blog/${id}`);
      setBlogs(b => b.filter(x => x._id !== id));
      toast.success('Blog deleted.');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed.'); }
    setDeleting(null);
  };

  const filtered = blogs.filter(b =>
    b.title.toLowerCase().includes(searchQ.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <AdminLayout title="Blog Management" subtitle="Create, edit, and manage blog posts.">
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search blogs…"
          style={{ padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', width: 260, outline: 'none' }} />
        <button onClick={openNew}
          style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          <i className="fas fa-plus" style={{ marginRight: 8 }} />New Blog Post
        </button>
      </div>

      {/* Blog list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Title', 'Category', 'Status', 'Views', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No blog posts found.</td></tr>
              ) : filtered.map((b, i) => (
                <tr key={b._id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.875rem', maxWidth: 280 }}>{b.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{b.slug}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: `${CAT_COLORS[b.category]}18`, color: CAT_COLORS[b.category], padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize' }}>{b.category}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: b.isPublished ? '#dcfce7' : '#f1f5f9', color: b.isPublished ? '#16a34a' : '#64748b', padding: '3px 10px', borderRadius: 20 }}>
                      {b.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.875rem' }}>{b.views || 0}</td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.8rem' }}>
                    {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(b)}
                        style={{ padding: '6px 14px', background: 'rgba(0,180,204,0.08)', border: '1px solid rgba(0,180,204,0.2)', borderRadius: 8, color: '#00B4CC', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                        <i className="fas fa-edit" style={{ marginRight: 4 }} />Edit
                      </button>
                      <button onClick={() => handleDelete(b._id)} disabled={deleting === b._id}
                        style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                        <i className="fas fa-trash" style={{ marginRight: 4 }} />{deleting === b._id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', width: '100%', maxWidth: 720, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, color: '#1a1a2e', margin: 0 }}>{editing ? 'Edit Blog Post' : 'New Blog Post'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Title *</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Blog post title" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Slug *</label>
                  <input value={form.slug} onChange={e => set('slug', toSlug(e.target.value))} placeholder="url-friendly-slug" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Excerpt * (shown in listing)</label>
                <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder="Short description of the post…" rows={2} style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div>
                <label style={lbl}>Content * (HTML or plain text)</label>
                <textarea value={form.content} onChange={e => set('content', e.target.value)} placeholder="Full blog content…" rows={8} style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Category *</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} style={inp}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Read Time</label>
                  <input value={form.readTime} onChange={e => set('readTime', e.target.value)} placeholder="5 min read" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Icon (FA class)</label>
                  <input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="fas fa-newspaper" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Tags (comma separated)</label>
                <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="amazon, marketing, seo" style={inp} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="published" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} style={{ width: 16, height: 16 }} />
                <label htmlFor="published" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Publish immediately</label>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 28px', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Create Post')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' };
const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
