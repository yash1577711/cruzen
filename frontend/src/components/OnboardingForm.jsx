import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import { toast } from 'react-toastify';

const inp = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0',
  borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
};
const lbl = {
  fontSize: '0.78rem', fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6, display: 'block',
};
const section = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
  padding: '24px', marginBottom: 20,
};

export default function OnboardingForm({ order, onComplete }) {
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    platformCredentials: { platform: '', accountId: '', loginEmail: '', loginPassword: '', storeName: '', storeUrl: '', gstin: '' },
    brandAssets: { brandName: '', brandDescription: '', targetAudience: '', competitorUrls: '', primaryColor: '#00B4CC' },
    contactPreferences: { preferredContactMethod: 'whatsapp', whatsappNumber: '', preferredTime: 'Morning (9am-12pm)' },
    businessGoals: '',
    additionalNotes: '',
  });

  useEffect(() => {
    api.get(`/onboarding/${order._id}`).then(r => {
      if (r.data.onboarding) {
        setExisting(r.data.onboarding);
        setData(prev => ({ ...prev, ...r.data.onboarding }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [order._id]);

  const set = (section, field, val) => setData(prev => ({
    ...prev, [section]: { ...prev[section], [field]: val },
  }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.post(`/onboarding/${order._id}`, data);
      toast.success('Onboarding details saved! Our team will reach out shortly.');
      onComplete?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    }
    setSaving(false);
  };

  const serviceName = order.service?.title || order.serviceName || 'Service';

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  if (existing?.isCompleted && step !== 99) {
    return (
      <div style={{ ...section, textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
        <h3 style={{ color: '#022B50', marginBottom: 8 }}>Onboarding Complete</h3>
        <p style={{ color: '#64748b', marginBottom: 20 }}>You've already submitted your details for <strong>{serviceName}</strong>.</p>
        <button onClick={() => setStep(99)} style={{ padding: '8px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#022B50' }}>
          Edit Details
        </button>
      </div>
    );
  }

  const steps = [
    { title: 'Platform Info', icon: 'fa-store' },
    { title: 'Brand Assets', icon: 'fa-palette' },
    { title: 'Contact & Goals', icon: 'fa-target' },
  ];

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {steps.map((s, i) => (
          <div key={i} onClick={() => setStep(i)} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: `2px solid ${step === i ? '#00B4CC' : '#e2e8f0'}`, background: step === i ? '#f0f9ff' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: step === i ? '#00B4CC' : '#94a3b8', marginBottom: 2 }}>Step {i + 1}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: step === i ? '#022B50' : '#94a3b8' }}>
              <i className={`fas ${s.icon}`} style={{ marginRight: 5 }} />{s.title}
            </div>
          </div>
        ))}
      </div>

      {/* Step 0: Platform */}
      {step === 0 && (
        <div style={section}>
          <h3 style={{ margin: '0 0 20px', color: '#022B50', fontSize: '1rem' }}>Platform / Account Information</h3>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 20 }}>Provide your marketplace/platform account details so our team can access and manage your account.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['platform', 'Platform (e.g. Amazon, Flipkart)', 'text'],
              ['storeName', 'Store / Business Name', 'text'],
              ['accountId', 'Seller/Account ID', 'text'],
              ['storeUrl', 'Store URL', 'url'],
              ['loginEmail', 'Login Email', 'email'],
              ['loginPassword', 'Login Password', 'password'],
              ['gstin', 'GSTIN', 'text'],
            ].map(([field, label, type]) => (
              <div key={field}>
                <label style={lbl}>{label}</label>
                <input type={type} value={data.platformCredentials[field] || ''} onChange={e => set('platformCredentials', field, e.target.value)} style={inp} placeholder={label} />
              </div>
            ))}
          </div>
          <div style={{ background: '#fff8e1', border: '1px solid #ffe08a', borderRadius: 8, padding: '10px 14px', marginTop: 16, fontSize: '0.78rem', color: '#856400' }}>
            <i className="fas fa-lock" style={{ marginRight: 6 }} />Your credentials are stored securely and only accessible to assigned team members.
          </div>
        </div>
      )}

      {/* Step 1: Brand */}
      {step === 1 && (
        <div style={section}>
          <h3 style={{ margin: '0 0 20px', color: '#022B50', fontSize: '1rem' }}>Brand Assets & Identity</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Brand Name</label>
              <input value={data.brandAssets.brandName} onChange={e => set('brandAssets', 'brandName', e.target.value)} style={inp} placeholder="Your brand name" />
            </div>
            <div>
              <label style={lbl}>Primary Brand Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={data.brandAssets.primaryColor} onChange={e => set('brandAssets', 'primaryColor', e.target.value)} style={{ width: 40, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                <input value={data.brandAssets.primaryColor} onChange={e => set('brandAssets', 'primaryColor', e.target.value)} style={{ ...inp, flex: 1 }} />
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Brand Description</label>
              <textarea value={data.brandAssets.brandDescription} onChange={e => set('brandAssets', 'brandDescription', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Describe your brand, products, and value proposition" />
            </div>
            <div>
              <label style={lbl}>Target Audience</label>
              <input value={data.brandAssets.targetAudience} onChange={e => set('brandAssets', 'targetAudience', e.target.value)} style={inp} placeholder="Who are your customers?" />
            </div>
            <div>
              <label style={lbl}>Competitor URLs</label>
              <input value={data.brandAssets.competitorUrls} onChange={e => set('brandAssets', 'competitorUrls', e.target.value)} style={inp} placeholder="e.g. competitor1.com, competitor2.com" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Logo / Brand Guideline URL (Google Drive, Dropbox, etc.)</label>
              <input value={data.brandAssets.logoUrl} onChange={e => set('brandAssets', 'logoUrl', e.target.value)} style={inp} placeholder="https://drive.google.com/..." />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Contact & Goals */}
      {step === 2 && (
        <div style={section}>
          <h3 style={{ margin: '0 0 20px', color: '#022B50', fontSize: '1rem' }}>Contact Preferences & Business Goals</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Preferred Contact Method</label>
              <select value={data.contactPreferences.preferredContactMethod} onChange={e => set('contactPreferences', 'preferredContactMethod', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="call">Phone Call</option>
              </select>
            </div>
            <div>
              <label style={lbl}>WhatsApp Number</label>
              <input value={data.contactPreferences.whatsappNumber} onChange={e => set('contactPreferences', 'whatsappNumber', e.target.value)} style={inp} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label style={lbl}>Preferred Call Time</label>
              <select value={data.contactPreferences.preferredTime} onChange={e => set('contactPreferences', 'preferredTime', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {['Morning (9am-12pm)', 'Afternoon (12pm-4pm)', 'Evening (4pm-7pm)'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Business Goals</label>
              <textarea value={data.businessGoals} onChange={e => setData(p => ({ ...p, businessGoals: e.target.value }))} rows={4} style={{ ...inp, resize: 'vertical' }} placeholder="What do you want to achieve? E.g. increase sales by 30%, launch on Amazon, improve rankings..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Additional Notes</label>
              <textarea value={data.additionalNotes} onChange={e => setData(p => ({ ...p, additionalNotes: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Any other information our team should know..." />
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          style={{ padding: '10px 24px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: step === 0 ? 'not-allowed' : 'pointer', opacity: step === 0 ? 0.4 : 1 }}>
          ← Back
        </button>
        {step < 2 ? (
          <button onClick={() => setStep(s => s + 1)}
            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={saving}
            style={{ padding: '10px 32px', borderRadius: 8, border: 'none', background: saving ? '#94a3b8' : 'linear-gradient(135deg,#00B4CC,#1dbf73)', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : 'Submit Onboarding'}
          </button>
        )}
      </div>
    </div>
  );
}
