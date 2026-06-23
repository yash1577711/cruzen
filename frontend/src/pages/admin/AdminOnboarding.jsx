import { useState, useEffect } from 'react';
import { AdminLayout } from './AdminDashboard.jsx';
import api from '../../api/axios.js';

const row = (label, value) => value ? (
  <div style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
    <div style={{ width: 160, fontSize: '0.75rem', fontWeight: 700, color: '#64748b', flexShrink: 0 }}>{label}</div>
    <div style={{ fontSize: '0.82rem', color: '#022B50', wordBreak: 'break-word' }}>{value}</div>
  </div>
) : null;

export default function AdminOnboarding() {
  const [onboardings, setOnboardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/onboarding/admin/all')
      .then(r => setOnboardings(r.data.onboardings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Client Onboarding" subtitle="View platform credentials and brand assets submitted by clients.">
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'start' }}>
        {/* List */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : onboardings.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
              <i className="fas fa-rocket" style={{ fontSize: '2rem', marginBottom: 12, display: 'block', opacity: 0.3 }} />
              No onboarding submissions yet.
            </div>
          ) : onboardings.map(ob => (
            <div key={ob._id}
              onClick={() => setSelected(ob)}
              style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: selected?._id === ob._id ? '#f0f9ff' : '#fff' }}
              onMouseEnter={e => { if (selected?._id !== ob._id) e.currentTarget.style.background = 'var(--bg-light)'; }}
              onMouseLeave={e => { if (selected?._id !== ob._id) e.currentTarget.style.background = '#fff'; }}>
              <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.875rem', marginBottom: 3 }}>{ob.user?.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: 3 }}>{ob.user?.email}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary-color)', fontWeight: 600 }}>
                {ob.order?.planName} · {ob.brandAssets?.brandName || ob.platformCredentials?.platform || '—'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 3 }}>
                {new Date(ob.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)', padding: '24px', boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--dark-blue)', fontSize: '1rem' }}>{selected.user?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{selected.user?.email} · {selected.user?.phone}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem' }}>✕</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Platform / Account</div>
              {row('Platform', selected.platformCredentials?.platform)}
              {row('Store Name', selected.platformCredentials?.storeName)}
              {row('Account ID', selected.platformCredentials?.accountId)}
              {row('Store URL', selected.platformCredentials?.storeUrl ? <a href={selected.platformCredentials.storeUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary-color)' }}>{selected.platformCredentials.storeUrl}</a> : null)}
              {row('Login Email', selected.platformCredentials?.loginEmail)}
              {row('Login Password', selected.platformCredentials?.loginPassword)}
              {row('GSTIN', selected.platformCredentials?.gstin)}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Brand Assets</div>
              {row('Brand Name', selected.brandAssets?.brandName)}
              {row('Description', selected.brandAssets?.brandDescription)}
              {row('Target Audience', selected.brandAssets?.targetAudience)}
              {row('Competitors', selected.brandAssets?.competitorUrls)}
              {row('Logo/Files', selected.brandAssets?.logoUrl ? <a href={selected.brandAssets.logoUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary-color)' }}>View Files</a> : null)}
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Contact & Goals</div>
              {row('WhatsApp', selected.contactPreferences?.whatsappNumber)}
              {row('Contact Method', selected.contactPreferences?.preferredContactMethod)}
              {row('Best Time', selected.contactPreferences?.preferredTime)}
              {row('Business Goals', selected.businessGoals)}
              {row('Notes', selected.additionalNotes)}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
