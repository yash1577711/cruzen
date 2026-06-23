import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { AdminLayout } from './AdminDashboard.jsx';
import api from '../../api/axios.js';

const ALL_SERVICES = [
  { id: 'amazon',         title: 'Amazon Management',           cat: 'Marketplace', defaultImg: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=900&q=80&auto=format&fit=crop' },
  { id: 'flipkart',       title: 'Flipkart Management',         cat: 'Marketplace', defaultImg: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&q=80&auto=format&fit=crop' },
  { id: 'meesho',         title: 'Meesho Management',           cat: 'Marketplace', defaultImg: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80&auto=format&fit=crop' },
  { id: 'ajio',           title: 'Ajio Management',             cat: 'Marketplace', defaultImg: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80&auto=format&fit=crop' },
  { id: 'myntra',         title: 'Myntra Management',           cat: 'Marketplace', defaultImg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80&auto=format&fit=crop' },
  { id: 'nyka',           title: 'Nykaa Management',            cat: 'Marketplace', defaultImg: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&q=80&auto=format&fit=crop' },
  { id: 'snapdeal',       title: 'Snapdeal Management',         cat: 'Marketplace', defaultImg: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80&auto=format&fit=crop' },
  { id: 'ebay',           title: 'eBay Management',             cat: 'Marketplace', defaultImg: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=900&q=80&auto=format&fit=crop' },
  { id: 'etsy',           title: 'Etsy Management',             cat: 'Marketplace', defaultImg: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900&q=80&auto=format&fit=crop' },
  { id: 'smo',            title: 'Social Media Optimization',   cat: 'Digital Marketing', defaultImg: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=900&q=80&auto=format&fit=crop' },
  { id: 'seo',            title: 'SEO',                         cat: 'Digital Marketing', defaultImg: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=900&q=80&auto=format&fit=crop' },
  { id: 'smm',            title: 'Social Media Marketing',      cat: 'Digital Marketing', defaultImg: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=900&q=80&auto=format&fit=crop' },
  { id: 'google-ads',     title: 'Google Ads',                  cat: 'Digital Marketing', defaultImg: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=900&q=80&auto=format&fit=crop' },
  { id: 'youtube',        title: 'YouTube Management',          cat: 'Digital Marketing', defaultImg: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=900&q=80&auto=format&fit=crop' },
  { id: 'influencer',     title: 'Influencer Marketing',        cat: 'Digital Marketing', defaultImg: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=900&q=80&auto=format&fit=crop' },
  { id: 'website-design', title: 'Website Design',              cat: 'Website', defaultImg: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=900&q=80&auto=format&fit=crop' },
  { id: 'ecommerce',      title: 'E-Commerce Website',          cat: 'Website', defaultImg: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&q=80&auto=format&fit=crop' },
  { id: 'shopify',        title: 'Shopify Development',         cat: 'Website', defaultImg: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=900&q=80&auto=format&fit=crop' },
  { id: 'mp-branding',    title: 'Marketplace Branding',        cat: 'Branding', defaultImg: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80&auto=format&fit=crop' },
  { id: 'branding',       title: 'Branding Plans',              cat: 'Branding', defaultImg: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=900&q=80&auto=format&fit=crop' },
  { id: '360',            title: '360° Marketing Plans',        cat: '360', defaultImg: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80&auto=format&fit=crop' },
];

const CATS = [...new Set(ALL_SERVICES.map(s => s.cat))];

function ServiceImageCard({ svc, savedData, onSave }) {
  const panelRef = useRef(null);
  const thumbRef = useRef(null);
  const [panelUrl, setPanelUrl] = useState(savedData?.panel || svc.defaultImg);
  const [thumbUrl, setThumbUrl] = useState(savedData?.thumb || svc.defaultImg);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);

  const handleFile = (type, file) => {
    if (!file) return;
    if (file.size > 500 * 1024) { toast.error('Max 500KB per image.'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      if (type === 'panel') { setPanelUrl(ev.target.result); markDirty(); }
      else { setThumbUrl(ev.target.result); markDirty(); }
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/site-config/service_images', { patch: { [svc.id]: { panel: panelUrl, thumb: thumbUrl } } });
      onSave(svc.id, { panel: panelUrl, thumb: thumbUrl });
      setDirty(false);
      toast.success(`${svc.title} images saved!`);
    } catch { toast.error('Failed to save.'); }
    finally { setSaving(false); }
  };

  const reset = () => {
    setPanelUrl(svc.defaultImg);
    setThumbUrl(svc.defaultImg);
    setDirty(true);
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${dirty ? '#f97316' : 'var(--border-color)'}`, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'border-color 0.2s' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--dark-blue)' }}>{svc.title}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{svc.cat}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={reset} style={{ padding: '5px 10px', background: 'var(--bg-light)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.72rem', color: 'var(--text-light)', cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>
          <button onClick={save} disabled={saving || !dirty} style={{ padding: '5px 12px', background: dirty ? 'var(--gradient-primary)' : 'var(--border-color)', color: dirty ? '#fff' : 'var(--text-light)', border: 'none', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, cursor: dirty ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.2s' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Panel Image */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Panel Image (Large)</div>
          <div style={{ position: 'relative', height: 100, borderRadius: 8, overflow: 'hidden', marginBottom: 8, background: '#f3f4f6', cursor: 'pointer' }} onClick={() => panelRef.current?.click()}>
            <img src={panelUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.opacity = 0.3; }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}>
              <i className="fas fa-camera" style={{ color: '#fff', fontSize: '1.2rem', opacity: 0 }} />
            </div>
            <input ref={panelRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile('panel', e.target.files[0])} />
          </div>
          <input
            placeholder="Or paste image URL…"
            value={panelUrl.startsWith('data:') ? '' : panelUrl}
            onChange={e => { setPanelUrl(e.target.value); markDirty(); }}
            style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border-color)', borderRadius: 7, fontSize: '0.78rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: 'var(--dark-blue)' }}
          />
        </div>

        {/* Thumb Image */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Sidebar Thumbnail</div>
          <div style={{ position: 'relative', height: 100, borderRadius: 8, overflow: 'hidden', marginBottom: 8, background: '#f3f4f6', cursor: 'pointer' }} onClick={() => thumbRef.current?.click()}>
            <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} onError={e => { e.target.style.opacity = 0.3; }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}>
              <i className="fas fa-camera" style={{ color: '#fff', fontSize: '1.2rem', opacity: 0 }} />
            </div>
            <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile('thumb', e.target.files[0])} />
          </div>
          <input
            placeholder="Or paste image URL…"
            value={thumbUrl.startsWith('data:') ? '' : thumbUrl}
            onChange={e => { setThumbUrl(e.target.value); markDirty(); }}
            style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border-color)', borderRadius: 7, fontSize: '0.78rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: 'var(--dark-blue)' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminServiceImages() {
  const [savedData, setSavedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('All');

  useEffect(() => {
    api.get('/site-config/service_images')
      .then(r => setSavedData(r.data.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (id, data) => setSavedData(prev => ({ ...prev, [id]: data }));

  const filtered = activeCat === 'All' ? ALL_SERVICES : ALL_SERVICES.filter(s => s.cat === activeCat);

  return (
    <AdminLayout title="Service Images" subtitle="Change panel and thumbnail images for each service. Changes go live instantly.">
      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {['All', ...CATS].map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)} style={{
            padding: '7px 16px', borderRadius: 20, border: '1.5px solid',
            borderColor: activeCat === cat ? 'var(--secondary-color)' : 'var(--border-color)',
            background: activeCat === cat ? 'rgba(0,180,204,0.1)' : '#fff',
            color: activeCat === cat ? 'var(--secondary-color)' : 'var(--text-light)',
            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
          }}>{cat}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
          {filtered.map(svc => (
            <ServiceImageCard key={svc.id} svc={svc} savedData={savedData[svc.id]} onSave={handleSave} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
