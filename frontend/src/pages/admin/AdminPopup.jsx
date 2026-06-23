import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../api/axios.js';

const SIDEBAR_LINKS = [
  { to: '/admin',               icon: 'fa-tachometer-alt',  label: 'Dashboard' },
  { to: '/admin/leads',         icon: 'fa-funnel-dollar',   label: 'Leads' },
  { to: '/admin/users',         icon: 'fa-users',           label: 'Users' },
  { to: '/admin/orders',        icon: 'fa-shopping-bag',    label: 'Orders' },
  { to: '/admin/tracker',       icon: 'fa-tasks',           label: 'Service Tracker' },
  { to: '/admin/email-blast',   icon: 'fa-paper-plane',     label: 'Email Blast' },
  { to: '/admin/consultations', icon: 'fa-calendar-check',  label: 'Consultations' },
  { to: '/admin/popup',          icon: 'fa-bullhorn',     label: 'Promo Popup', active: true },
  { to: '/admin/service-images', icon: 'fa-images',       label: 'Service Images' },
  { to: '/admin/sub-admins',     icon: 'fa-user-shield',  label: 'Sub-Admins' },
];

const S = {
  layout:   { display: 'flex', minHeight: '100vh', background: '#f4f6f9', fontFamily: 'inherit' },
  sidebar:  { width: 240, background: '#011e38', color: '#fff', position: 'fixed', top: 0, left: 0, height: '100vh', display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto' },
  main:     { marginLeft: 240, flex: 1, padding: '32px', minHeight: '100vh' },
  card:     { background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 },
  label:    { display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:    { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.92rem', color: '#1a1a2e', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', transition: 'border-color 0.2s' },
  textarea: { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.92rem', color: '#1a1a2e', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', resize: 'vertical', minHeight: 80, transition: 'border-color 0.2s' },
  select:   { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.92rem', color: '#1a1a2e', outline: 'none', fontFamily: 'inherit', background: '#fff', cursor: 'pointer' },
  btn:      { padding: '11px 28px', background: 'linear-gradient(135deg,#0dbfc8,#15D8E1)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 },
  field:    { marginBottom: 20 },
  row:      { display: 'flex', gap: 20, flexWrap: 'wrap' },
};

export default function AdminPopup() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef(null);

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [imgMode, setImgMode]   = useState('url'); // 'url' | 'upload'

  const [form, setForm] = useState({
    enabled: true,
    imageUrl: '',
    title: 'Free Strategy Call',
    subtitle: 'Book a 30-min session with our experts — zero cost, zero pressure.',
    ctaText: 'Book Free Consultation',
    showFrequency: 'once_per_session',
  });

  useEffect(() => {
    api.get('/popup')
      .then(r => {
        const p = r.data.popup;
        setForm({
          enabled:       p.enabled       ?? true,
          imageUrl:      p.imageUrl      ?? '',
          title:         p.title         ?? '',
          subtitle:      p.subtitle      ?? '',
          ctaText:       p.ctaText       ?? '',
          showFrequency: p.showFrequency ?? 'once_per_session',
        });
        if (p.imageUrl?.startsWith('data:')) setImgMode('upload');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/popup', form);
      showToast('Popup saved successfully!');
    } catch {
      showToast('Failed to save. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('Image must be under 3MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, imageUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div style={S.layout}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={{ padding: '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Link to="/" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', textDecoration: 'none' }}>
            <span style={{ color: '#15D8E1' }}>Cruzen</span>Digital
          </Link>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Admin Panel</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {SIDEBAR_LINKS.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '10px 20px',
                background: active ? 'rgba(21,216,225,0.1)' : 'none',
                color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
                borderLeft: active ? '3px solid #15D8E1' : '3px solid transparent', transition: 'all 0.18s',
              }}>
                <i className={`fas ${item.icon}`} style={{ width: 16, textAlign: 'center', color: active ? '#15D8E1' : 'inherit' }} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            {toast.msg}
          </div>
        )}

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>Promo Popup</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Configure the promotional popup shown to visitors on the home page.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Loading...</div>
        ) : (
          <>
            {/* Enable toggle */}
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', marginBottom: 4 }}>Popup Status</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Enable or disable the popup for all visitors.</div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div
                    onClick={() => set('enabled', !form.enabled)}
                    style={{
                      width: 52, height: 28, borderRadius: 14,
                      background: form.enabled ? '#15D8E1' : '#e2e8f0',
                      position: 'relative', cursor: 'pointer', transition: 'background 0.25s',
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 3, left: form.enabled ? 27 : 3,
                      transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                    }} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: form.enabled ? '#15D8E1' : '#9ca3af' }}>
                    {form.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>

            {/* Content */}
            <div style={S.card}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 20 }}>Popup Content</h2>

              <div style={S.field}>
                <label style={S.label}>Title</label>
                <input style={S.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Free Strategy Call" />
              </div>

              <div style={S.field}>
                <label style={S.label}>Subtitle</label>
                <textarea style={S.textarea} value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Short description shown below the title..." />
              </div>

              <div style={S.row}>
                <div style={{ ...S.field, flex: 1 }}>
                  <label style={S.label}>CTA Button Text</label>
                  <input style={S.input} value={form.ctaText} onChange={e => set('ctaText', e.target.value)} placeholder="e.g. Book Free Consultation" />
                </div>
                <div style={{ ...S.field, flex: 1 }}>
                  <label style={S.label}>Show Frequency</label>
                  <select style={S.select} value={form.showFrequency} onChange={e => set('showFrequency', e.target.value)}>
                    <option value="once_per_session">Once per browser session</option>
                    <option value="once_per_day">Once per day</option>
                    <option value="always">Every page visit</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Image */}
            <div style={S.card}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 16 }}>Popup Image</h2>

              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                {['url', 'upload'].map(mode => (
                  <button key={mode} onClick={() => setImgMode(mode)} style={{
                    padding: '8px 18px', borderRadius: 8, border: '1.5px solid',
                    borderColor: imgMode === mode ? '#15D8E1' : '#e2e8f0',
                    background: imgMode === mode ? 'rgba(21,216,225,0.08)' : '#fff',
                    color: imgMode === mode ? '#0dbfc8' : '#6b7280',
                    fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {mode === 'url' ? 'Paste URL' : 'Upload File'}
                  </button>
                ))}
              </div>

              {imgMode === 'url' ? (
                <div style={S.field}>
                  <label style={S.label}>Image URL</label>
                  <input
                    style={S.input}
                    value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                    onChange={e => set('imageUrl', e.target.value)}
                    placeholder="https://images.unsplash.com/... or your CDN link"
                  />
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 6 }}>Paste any image URL (Unsplash, your CDN, Google Drive public link, etc.)</div>
                </div>
              ) : (
                <div style={S.field}>
                  <label style={S.label}>Upload Image</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{ border: '2px dashed #e2e8f0', borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#15D8E1'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: 6 }}>
                      <i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.8rem', display: 'block', marginBottom: 8, color: '#cbd5e1' }} />
                      Click to upload an image
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>PNG, JPG, WebP — max 3MB</div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                  </div>
                </div>
              )}

              {/* Preview */}
              {form.imageUrl && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preview</div>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={form.imageUrl}
                      alt="Popup preview"
                      style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 12, objectFit: 'cover', display: 'block', border: '1.5px solid #e2e8f0' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <button
                      onClick={() => set('imageUrl', '')}
                      style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Popup Live Preview */}
            <div style={S.card}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 16 }}>Live Preview</h2>
              <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', width: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', position: 'relative' }}>
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                  )}
                  <div style={{ padding: '24px 24px 20px', textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(21,216,225,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#15D8E1', fontSize: '1.3rem' }}>
                      <i className="fas fa-phone-alt" />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a1a2e', marginBottom: 8 }}>{form.title || 'Popup Title'}</div>
                    <div style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.6, marginBottom: 18 }}>{form.subtitle || 'Popup subtitle text here.'}</div>
                    <div style={{ background: 'linear-gradient(135deg,#0dbfc8,#15D8E1)', color: '#fff', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: '0.85rem', marginBottom: 10 }}>
                      {form.ctaText || 'Book Free Consultation'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>No thanks, maybe later</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={handleSave} disabled={saving} style={{ ...S.btn, opacity: saving ? 0.7 : 1 }}>
                {saving ? (
                  <><i className="fas fa-spinner fa-spin" /> Saving...</>
                ) : (
                  <><i className="fas fa-save" /> Save Changes</>
                )}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
