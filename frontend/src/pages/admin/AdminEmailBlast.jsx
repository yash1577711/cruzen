import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../api/axios.js';

const SIDEBAR_LINKS = [
  { to: '/admin', icon: 'fa-tachometer-alt', label: 'Dashboard' },
  { to: '/admin/leads', icon: 'fa-funnel-dollar', label: 'Leads' },
  { to: '/admin/users', icon: 'fa-users', label: 'Users' },
  { to: '/admin/orders', icon: 'fa-shopping-bag', label: 'Orders' },
  { to: '/admin/tracker', icon: 'fa-tasks', label: 'Service Tracker' },
  { to: '/admin/email-blast', icon: 'fa-paper-plane', label: 'Email Blast', active: true },
  { to: '/admin/consultations', icon: 'fa-calendar-check', label: 'Consultations' },
  { to: '/admin/sub-admins', icon: 'fa-user-shield', label: 'Sub-Admins' },
];

const CATEGORIES = [
  { value: 'e-commerce', label: 'E-Commerce' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design-development', label: 'Design & Development' },
];

const TAB_BLAST = 'blast';
const TAB_WELCOME = 'welcome';

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: 12 }}>📨</div>
        <h3 style={{ fontWeight: 800, color: 'var(--dark-blue)', textAlign: 'center', marginBottom: 8 }}>Confirm Send</h3>
        <p style={{ color: 'var(--text-light)', textAlign: 'center', fontSize: '0.9rem', marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: '#fff', color: 'var(--text-light)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, background: 'var(--gradient-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, Send</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminEmailBlast() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }
  const [tab, setTab] = useState(TAB_BLAST);

  // Blast state
  const [target, setTarget] = useState('all');
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Welcome template state
  const [wSubject, setWSubject] = useState('');
  const [wBody, setWBody] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [sendingWelcome, setSendingWelcome] = useState(false);

  useEffect(() => {
    api.get('/admin/users').then(() => {}).catch(() => {});
    // Load services list
    api.get('/services').then(({ data }) => setServices(data.services || [])).catch(() => {});
    // Load welcome template
    api.get('/admin/email-blast/welcome-template').then(({ data }) => {
      if (data.template) { setWSubject(data.template.subject); setWBody(data.template.body); }
    }).catch(() => {});
  }, []);

  // Auto-fetch recipient count when target changes
  useEffect(() => {
    if (target === 'service' && !serviceId) return;
    if (target === 'category' && !category) return;
    setPreviewLoading(true);
    const params = { target };
    if (target === 'service') params.serviceId = serviceId;
    if (target === 'category') params.category = category;
    api.get('/admin/email-blast/stats', { params })
      .then(({ data }) => setPreview(data))
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false));
  }, [target, serviceId, category]);

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) return toast.error('Subject and message body are required.');
    if (target === 'service' && !serviceId) return toast.error('Please select a service.');
    if (target === 'category' && !category) return toast.error('Please select a category.');
    setConfirm({
      message: `This will send the email to ${preview?.count || '?'} users. Continue?`,
      onConfirm: async () => {
        setConfirm(null);
        setSending(true);
        try {
          const { data } = await api.post('/admin/email-blast/send', { target, serviceId, category, subject, body });
          toast.success(data.message);
          if (data.failed > 0) toast.warn(`${data.failed} emails failed to deliver.`);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to send emails.');
        } finally {
          setSending(false);
        }
      },
    });
  };

  const handleSaveTemplate = async () => {
    if (!wSubject.trim() || !wBody.trim()) return toast.error('Subject and body are required.');
    setSavingTemplate(true);
    try {
      await api.post('/admin/email-blast/welcome-template', { subject: wSubject, body: wBody });
      toast.success('Welcome template saved.');
    } catch (err) {
      toast.error('Failed to save template.');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSendWelcomeAll = () => {
    setConfirm({
      message: 'This will send the welcome email to ALL registered users. Continue?',
      onConfirm: async () => {
        setConfirm(null);
        setSendingWelcome(true);
        try {
          const { data } = await api.post('/admin/email-blast/send-welcome-all');
          toast.success(data.message);
          if (data.failed > 0) toast.warn(`${data.failed} emails failed to deliver.`);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to send welcome emails.');
        } finally {
          setSendingWelcome(false);
        }
      },
    });
  };

  const sidebarStyle = { width: 240, background: 'var(--dark-blue)', color: '#fff', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100, overflowY: 'auto', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)', display: 'flex' }}>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} className="dash-overlay" />}

      <aside style={sidebarStyle} className={`dash-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontWeight: 800, color: '#fff', textDecoration: 'none', fontSize: '1.1rem' }}>
            <span style={{ color: 'var(--secondary-color)' }}>Cruzen</span>Digital
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="dash-close-btn" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'none', fontSize: '1rem' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Admin Panel</span>
          <p style={{ fontWeight: 700, margin: '4px 0 0', fontSize: '0.875rem' }}>{user?.name}</p>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {SIDEBAR_LINKS.map(l => (
            <Link key={l.to} to={l.to}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s', borderLeft: l.active ? '3px solid var(--secondary-color)' : '3px solid transparent', background: l.active ? 'rgba(0,180,204,0.15)' : 'none', color: l.active ? '#fff' : 'rgba(255,255,255,0.65)' }}>
              <i className={`fas ${l.icon}`} style={{ width: 16 }}></i> {l.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
            <i className="fas fa-globe"></i> Visit Website
          </Link>
          <button onClick={async () => { await logout(); navigate('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 8, color: '#fca5a5', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit' }}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="dash-mobile-topbar" style={{ display: 'none' }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}>
          <i className="fas fa-bars"></i>
        </button>
        <span style={{ fontWeight: 800 }}><span style={{ color: 'var(--secondary-color)' }}>Cruzen</span>Digital</span>
        <div style={{ width: 32 }} />
      </div>

      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

      <main className="dash-main" style={{ marginLeft: 240, flex: 1, padding: '32px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-blue)', margin: 0 }}>Email Blast</h1>
          <p style={{ color: 'var(--text-light)', marginTop: 4 }}>Send bulk emails to your users. Use <code>{'{{name}}'}</code> and <code>{'{{email}}'}</code> as personalization tokens.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#fff', padding: 4, borderRadius: 12, border: '1px solid var(--border-color)', width: 'fit-content', marginBottom: 28 }}>
          {[{ key: TAB_BLAST, label: 'Custom Email', icon: 'fa-paper-plane' }, { key: TAB_WELCOME, label: 'Welcome Message', icon: 'fa-envelope-open-text' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit', transition: 'all 0.2s', background: tab === t.key ? 'var(--gradient-primary)' : 'none', color: tab === t.key ? '#fff' : 'var(--text-light)' }}>
              <i className={`fas ${t.icon}`}></i> {t.label}
            </button>
          ))}
        </div>

        {tab === TAB_BLAST && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
            {/* Left — compose */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 20 }}>Compose Email</h3>

              {/* Target selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.85rem', marginBottom: 8 }}>Send To</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[{ v: 'all', label: 'All Users', icon: 'fa-users' }, { v: 'category', label: 'By Category', icon: 'fa-tags' }, { v: 'service', label: 'By Service', icon: 'fa-box' }].map(opt => (
                    <button key={opt.v} onClick={() => setTarget(opt.v)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: `2px solid ${target === opt.v ? 'var(--secondary-color)' : 'var(--border-color)'}`, borderRadius: 8, background: target === opt.v ? 'rgba(0,180,204,0.08)' : '#fff', color: target === opt.v ? 'var(--secondary-color)' : 'var(--text-light)', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                      <i className={`fas ${opt.icon}`}></i> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {target === 'category' && (
                <div className="form-field" style={{ marginBottom: 16 }}>
                  <label>Select Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">— Choose category —</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              )}

              {target === 'service' && (
                <div className="form-field" style={{ marginBottom: 16 }}>
                  <label>Select Service</label>
                  <select value={serviceId} onChange={e => setServiceId(e.target.value)}>
                    <option value="">— Choose service —</option>
                    {services.map(s => <option key={s._id} value={s._id}>{s.title}</option>)}
                  </select>
                </div>
              )}

              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Email Subject</label>
                <input type="text" placeholder="e.g. Special offer for you, {{name}}!" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>

              <div className="form-field" style={{ marginBottom: 24 }}>
                <label>Message Body <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: '0.78rem' }}>(HTML supported · use {'{{name}}'} {'{{email}}'})</span></label>
                <textarea rows={10} placeholder="<p>Hi {{name}},</p><p>Your message here...</p>" value={body} onChange={e => setBody(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical', minHeight: 200 }} />
              </div>

              <button onClick={handleSend} disabled={sending || !preview?.count}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'var(--gradient-primary)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontSize: '0.95rem', fontFamily: 'inherit', opacity: sending ? 0.7 : 1, transition: 'all 0.2s' }}>
                {sending ? <><span className="spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Sending...</> : <><i className="fas fa-paper-plane"></i> Send to {preview?.count ?? '...'} Users</>}
              </button>
            </div>

            {/* Right — preview panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 16, fontSize: '0.95rem' }}>
                  <i className="fas fa-users" style={{ marginRight: 8, color: 'var(--secondary-color)' }}></i>
                  Recipients
                </h4>
                {previewLoading ? (
                  <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" style={{ margin: '0 auto', width: 24, height: 24 }} /></div>
                ) : preview ? (
                  <>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 4 }}>{preview.count}</div>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.82rem', marginBottom: 16 }}>users will receive this email</p>
                    {preview.preview?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Sample recipients</p>
                        {preview.preview.map((u, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--bg-light)' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--dark-blue)' }}>{u.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{u.email}</div>
                            </div>
                          </div>
                        ))}
                        {preview.count > 5 && <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 8 }}>+{preview.count - 5} more...</p>}
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Select a target to see recipients.</p>
                )}
              </div>

              {/* Tips */}
              <div style={{ background: 'rgba(0,180,204,0.06)', border: '1px solid rgba(0,180,204,0.2)', borderRadius: 12, padding: 18 }}>
                <p style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.85rem', marginBottom: 8 }}>
                  <i className="fas fa-lightbulb" style={{ marginRight: 6, color: 'var(--secondary-color)' }}></i> Tips
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-light)', fontSize: '0.8rem', lineHeight: 1.8 }}>
                  <li>Use <code>{'{{name}}'}</code> for personalized greeting</li>
                  <li>Use <code>{'{{email}}'}</code> to show their email</li>
                  <li>HTML tags work in the body</li>
                  <li>Check recipient count before sending</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === TAB_WELCOME && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 6 }}>Welcome Email Template</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: 24 }}>This template is sent automatically when new users sign up. You can also broadcast it to all users.</p>

              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Subject</label>
                <input type="text" value={wSubject} onChange={e => setWSubject(e.target.value)} placeholder="Welcome to Cruzen Digital!" />
              </div>

              <div className="form-field" style={{ marginBottom: 24 }}>
                <label>Body <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: '0.78rem' }}>(HTML · {'{{name}}'} {'{{email}}'})</span></label>
                <textarea rows={12} value={wBody} onChange={e => setWBody(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical', minHeight: 240 }} />
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={handleSaveTemplate} disabled={savingTemplate}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: 'var(--gradient-primary)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', opacity: savingTemplate ? 0.7 : 1 }}>
                  {savingTemplate ? <><span className="spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Saving...</> : <><i className="fas fa-save"></i> Save Template</>}
                </button>
                <button onClick={handleSendWelcomeAll} disabled={sendingWelcome}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: 'rgba(239,68,68,0.08)', border: '1.5px solid #ef4444', borderRadius: 10, color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', opacity: sendingWelcome ? 0.7 : 1 }}>
                  {sendingWelcome ? <><span className="spinner-sm" style={{ borderTopColor: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} /> Sending...</> : <><i className="fas fa-broadcast-tower"></i> Send to All Users</>}
                </button>
              </div>
            </div>

            {/* Info panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ fontWeight: 800, color: 'var(--dark-blue)', marginBottom: 12, fontSize: '0.95rem' }}>
                  <i className="fas fa-info-circle" style={{ marginRight: 8, color: 'var(--secondary-color)' }}></i>
                  When is it sent?
                </h4>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-light)', fontSize: '0.85rem', lineHeight: 2 }}>
                  <li>Automatically on new signup</li>
                  <li>Manually via "Send to All Users"</li>
                </ul>
              </div>
              <div style={{ background: 'rgba(29,191,115,0.06)', border: '1px solid rgba(29,191,115,0.2)', borderRadius: 12, padding: 18 }}>
                <p style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.85rem', marginBottom: 8 }}>
                  <i className="fas fa-code" style={{ marginRight: 6, color: '#1dbf73' }}></i> Tokens
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-light)', fontSize: '0.8rem', lineHeight: 2 }}>
                  <li><code>{'{{name}}'}</code> — user's full name</li>
                  <li><code>{'{{email}}'}</code> — user's email</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
