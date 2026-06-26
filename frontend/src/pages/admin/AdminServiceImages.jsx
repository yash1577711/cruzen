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

// Client-side image compression using Canvas API
// Handles large photos (5–10MB) and compresses down to ~100–200KB
async function compressImage(file, maxW, maxH, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      // Scale down maintaining aspect ratio
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Invalid image')); };
    img.src = url;
  });
}

function formatBytes(base64) {
  // Approximate byte size of a base64 data URL
  const raw = base64.replace(/^data:.+;base64,/, '');
  const bytes = Math.round(raw.length * 0.75);
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── Image slot component ───────────────────────────────────────────────────
function ImageSlot({ label, hint, sublabel, url, onUrl, maxW, maxH, aspectStyle }) {
  const fileRef = useRef(null);
  const [compressing, setCompressing] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('File too large. Maximum 20 MB.'); return; }
    setCompressing(true);
    try {
      const compressed = await compressImage(file, maxW, maxH);
      const sizeStr = formatBytes(compressed);
      onUrl(compressed);
      toast.success(`Image compressed to ${sizeStr} ✓`, { toastId: 'compress-ok', autoClose: 2000 });
    } catch {
      toast.error('Could not process image. Try another file.');
    } finally {
      setCompressing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const isBase64 = url?.startsWith('data:');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--dark-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
          {sublabel && <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', marginTop: 1 }}>{sublabel}</div>}
        </div>
        {isBase64 && <div style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '2px 7px', borderRadius: 10 }}>{formatBytes(url)} · custom</div>}
      </div>

      {/* Preview + click-to-upload */}
      <div
        style={{ position: 'relative', ...aspectStyle, borderRadius: 10, overflow: 'hidden', marginBottom: 8, background: '#f3f4f6', cursor: compressing ? 'wait' : 'pointer', border: '2px dashed var(--border-color)', transition: 'border-color 0.2s' }}
        onClick={() => !compressing && fileRef.current?.click()}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--secondary-color)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        title="Click to upload an image"
      >
        {url ? (
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }} />
        ) : null}
        {/* Upload overlay — always visible */}
        <div style={{
          position: 'absolute', inset: 0,
          background: url ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6, transition: 'background 0.2s',
        }}>
          {compressing ? (
            <><div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, borderColor: '#fff transparent transparent transparent' }} />
            <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>Compressing…</span></>
          ) : (
            <><i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.4rem', color: url ? '#fff' : '#94a3b8' }} />
            <span style={{ color: url ? '#fff' : '#94a3b8', fontSize: '0.72rem', fontWeight: 700 }}>
              {url ? 'Click to change' : 'Click to upload'}
            </span>
            {hint && !url && <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{hint}</span>}</>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      {/* URL input */}
      <input
        placeholder="Or paste image URL…"
        value={isBase64 ? '' : (url || '')}
        onChange={e => onUrl(e.target.value)}
        style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border-color)', borderRadius: 7, fontSize: '0.78rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: 'var(--dark-blue)' }}
      />
    </div>
  );
}

// ── Service image card ─────────────────────────────────────────────────────
function ServiceImageCard({ svc, savedData, onSave }) {
  const [landingUrl, setLandingUrl] = useState(savedData?.landing || savedData?.panel || svc.defaultImg);
  const [thumbUrl,   setThumbUrl]   = useState(savedData?.thumb || svc.defaultImg);
  const [saving, setSaving]         = useState(false);
  const [dirty, setDirty]           = useState(false);

  const mark = setter => val => { setter(val); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/site-config/service_images', {
        patch: { [svc.id]: { landing: landingUrl, thumb: thumbUrl } },
      });
      onSave(svc.id, { landing: landingUrl, thumb: thumbUrl });
      setDirty(false);
      toast.success(`${svc.title} images saved!`);
    } catch {
      toast.error('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setLandingUrl(svc.defaultImg);
    setThumbUrl(svc.defaultImg);
    setDirty(true);
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: `2px solid ${dirty ? '#f97316' : 'var(--border-color)'}`,
      overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'border-color 0.2s',
    }}>
      {/* Card header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: dirty ? '#fff7ed' : '#fff', transition: 'background 0.2s' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--dark-blue)' }}>{svc.title}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: 1 }}>{svc.cat}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {dirty && <span style={{ fontSize: '0.65rem', color: '#f97316', fontWeight: 700, background: '#ffedd5', padding: '2px 8px', borderRadius: 10 }}>Unsaved</span>}
          <button onClick={reset} style={{ padding: '5px 10px', background: 'var(--bg-light)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.72rem', color: 'var(--text-light)', cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>
          <button onClick={save} disabled={saving || !dirty} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: '0.78rem', fontWeight: 700,
            background: dirty ? 'linear-gradient(135deg,#1dbf73,#00B4CC)' : 'var(--border-color)',
            color: dirty ? '#fff' : 'var(--text-light)',
            cursor: dirty && !saving ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {saving ? <><span className="spinner-sm" />Saving…</> : <><i className="fas fa-save" />Save</>}
          </button>
        </div>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* Landing page hero (wide, landscape) */}
        <ImageSlot
          label="Service Landing Page Hero"
          sublabel="Shown on the full service page (/services/amazon etc.)"
          hint="Landscape recommended · any size up to 20 MB"
          url={landingUrl}
          onUrl={mark(setLandingUrl)}
          maxW={1200} maxH={800}
          aspectStyle={{ height: 130 }}
        />

        {/* Service card thumbnail (square-ish) */}
        <ImageSlot
          label="Services Grid Card"
          sublabel="Shown in the /services listing grid"
          hint="Square or portrait · any size"
          url={thumbUrl}
          onUrl={mark(setThumbUrl)}
          maxW={500} maxH={500}
          aspectStyle={{ height: 130 }}
        />
      </div>

      <div style={{ padding: '8px 16px 12px', background: '#f8fafc', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', gap: 16 }}>
          <span><i className="fas fa-info-circle" style={{ marginRight: 4 }} />Images are auto-compressed before saving. Max upload: 20 MB.</span>
          <span style={{ color: '#1dbf73', fontWeight: 600 }}><i className="fas fa-check-circle" style={{ marginRight: 4 }} />Saved images go live instantly — no rebuild needed.</span>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AdminServiceImages() {
  const [savedData, setSavedData] = useState({});
  const [loading,   setLoading]   = useState(true);
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
    <AdminLayout
      title="Service Images"
      subtitle="Upload custom photos for each service. Images are compressed automatically — you can upload large files (up to 20 MB) directly."
    >
      {/* Info banner */}
      <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <i className="fas fa-lightbulb" style={{ color: '#3b82f6', fontSize: '1rem', marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: '0.82rem', color: '#1e40af', lineHeight: 1.6 }}>
          <strong>How it works:</strong> Upload any image (JPEG, PNG, WebP — up to 20 MB). It's automatically compressed for fast loading.
          The <strong>Landing Page Hero</strong> appears when clients visit a service page (e.g. /services/amazon).
          The <strong>Services Grid Card</strong> appears in the /services browse grid.
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
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
        <div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 16 }}>
          {filtered.map(svc => (
            <ServiceImageCard key={svc.id} svc={svc} savedData={savedData[svc.id]} onSave={handleSave} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
