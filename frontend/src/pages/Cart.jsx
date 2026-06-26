import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ConsultationModal from '../components/ConsultationModal.jsx';
import api from '../api/axios.js';

const DURATION_OPTS = [
  { months: 1, label: '1 month', disc: 0 },
  { months: 3, label: '3 months', disc: 5 },
  { months: 6, label: '6 months', disc: 10 },
  { months: 12, label: '12 months', disc: 20 },
];

export default function Cart() {
  const { items, removeFromCart, updateItem, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultOpen, setConsultOpen] = useState(false);
  const [paying, setPaying] = useState(null);

  const GST_RATE = 0.18;
  const subtotal = items.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalSavings = items.reduce((s, i) => {
    const full = (i.price || 0) * (i.quantity || 1) * (i.duration || 1);
    return s + (full - (i.totalAmount || full));
  }, 0);
  const gstTotal  = Math.round(subtotal * GST_RATE);
  const total     = subtotal + gstTotal;

  const submitPayU = (url, params) => {
    const form = document.createElement('form');
    form.method = 'POST'; form.action = url;
    Object.entries(params).forEach(([k, v]) => {
      const inp = document.createElement('input');
      inp.type = 'hidden'; inp.name = k; inp.value = String(v ?? '');
      form.appendChild(inp);
    });
    document.body.appendChild(form); form.submit();
  };

  const handleBuyItem = async (item, idx) => {
    if (!user) { navigate('/login?redirect=/cart'); return; }
    if (user.role !== 'user') {
      toast.info('Service purchases are available for client accounts.', { toastId: 'staff-buy' });
      return;
    }
    setPaying(idx);
    try {
      const itemSubtotal = item.totalAmount || 0;
      const itemGst      = Math.round(itemSubtotal * GST_RATE);
      const { data: { order, razorpayOrderId, testMode: rzpTest } } =
        await api.post('/orders/create', {
          serviceName: item.service,
          planName: item.planName,
          amount: itemSubtotal + itemGst,
          duration: item.duration,
          quantity: item.quantity,
        });
      try {
        const { data: { payuUrl, params, testMode: payuTest } } =
          await api.post('/orders/payu/init', { orderId: order._id });
        if (!payuTest) { removeFromCart(idx); submitPayU(payuUrl, params); return; }
      } catch (e) { console.warn('PayU:', e.message); }
      await api.post('/orders/verify', {
        razorpayOrderId, razorpayPaymentId: `demo_${Date.now()}`,
        razorpaySignature: `demo_${Date.now()}`, orderId: order._id, testMode: rzpTest !== false,
      });
      removeFromCart(idx);
      toast.success('Payment confirmed! Order is now active.', { toastId: 'pay-ok' });
      if (items.length <= 1) navigate('/dashboard?tab=tracker');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed.', { toastId: 'pay-err' });
    } finally { setPaying(null); }
  };

  return (
    <>
      <Header openConsultation={() => setConsultOpen(true)} />
      <main style={{ minHeight: '100vh', paddingTop: 96, paddingBottom: 80, background: 'var(--bg-light)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <Link to="/services" style={{ color: 'var(--text-light)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fas fa-arrow-left" style={{ fontSize: '0.75rem' }} /> Continue Shopping
            </Link>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-blue)', margin: 0 }}>
              Your Cart {items.length > 0 && <span style={{ color: 'var(--text-light)', fontWeight: 600, fontSize: '1rem' }}>({items.length} item{items.length !== 1 ? 's' : ''})</span>}
            </h1>
          </div>

          {items.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 20, padding: '80px 24px', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🛒</div>
              <h2 style={{ color: 'var(--dark-blue)', marginBottom: 8 }}>Your cart is empty</h2>
              <p style={{ color: 'var(--text-light)', marginBottom: 28 }}>Browse our services and add plans to get started.</p>
              <Link to="/services" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--dark-blue)', color: '#fff', textDecoration: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 700 }}>
                Browse Services <i className="fas fa-arrow-right" />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, alignItems: 'start' }}>

              {/* ── Cart Items ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {items.map((item, idx) => {
                  const accent = item.catColor || '#00B4CC';
                  const fullPrice = (item.price || 0) * (item.quantity || 1) * (item.duration || 1);
                  const savings = fullPrice - (item.totalAmount || fullPrice);
                  return (
                    <div key={idx} style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${paying === idx ? accent : 'var(--border-color)'}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', transition: 'border-color 0.2s' }}>

                      {/* Item header */}
                      <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontSize: '1.2rem', flexShrink: 0 }}>
                          <i className="fas fa-star" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, color: 'var(--dark-blue)', fontSize: '1rem' }}>{item.service}</div>
                          <span style={{ display: 'inline-block', marginTop: 4, background: `${accent}18`, color: accent, padding: '2px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.8rem' }}>{item.planName} Plan</span>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '1.3rem', color: accent }}>₹{Math.round((item.totalAmount || 0) * 1.18).toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700 }}>incl. 18% GST</div>
                          {savings > 0 && <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>Save ₹{savings.toLocaleString('en-IN')}</div>}
                        </div>
                      </div>

                      {/* ── Duration selector ── */}
                      <div style={{ padding: '0 24px 16px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          <i className="fas fa-calendar-alt" style={{ marginRight: 6 }} />Duration
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {DURATION_OPTS.map(opt => (
                            <button key={opt.months} type="button"
                              onClick={() => updateItem(idx, { duration: opt.months })}
                              style={{
                                padding: '7px 14px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                                border: item.duration === opt.months ? `2px solid ${accent}` : '2px solid var(--border-color)',
                                background: item.duration === opt.months ? `${accent}12` : '#f8fafc',
                                color: item.duration === opt.months ? accent : 'var(--text-light)',
                                position: 'relative',
                              }}>
                              {opt.label}
                              {opt.disc > 0 && (
                                <span style={{ marginLeft: 6, fontSize: '0.65rem', background: item.duration === opt.months ? accent : '#dcfce7', color: item.duration === opt.months ? '#fff' : '#16a34a', padding: '1px 5px', borderRadius: 6, fontWeight: 800 }}>
                                  -{opt.disc}%
                                </span>
                              )}
                            </button>
                          ))}
                          {/* Custom months input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: '2px solid var(--border-color)', borderRadius: 10, padding: '0 8px', background: '#f8fafc' }}>
                            <button type="button" onClick={() => updateItem(idx, { duration: Math.max(1, (item.duration || 1) - 1) })}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '1rem', padding: '4px 2px', lineHeight: 1, fontWeight: 700 }}>−</button>
                            <input type="number" min="1" max="24" value={item.duration || 1}
                              onChange={e => updateItem(idx, { duration: Math.max(1, Math.min(24, parseInt(e.target.value) || 1)) })}
                              style={{ width: 32, border: 'none', background: 'none', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--dark-blue)', fontFamily: 'inherit', outline: 'none', padding: '6px 0' }} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginRight: 2 }}>mo</span>
                            <button type="button" onClick={() => updateItem(idx, { duration: Math.min(24, (item.duration || 1) + 1) })}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '1rem', padding: '4px 2px', lineHeight: 1, fontWeight: 700 }}>+</button>
                          </div>
                        </div>
                      </div>

                      {/* ── Quantity (accounts) ── */}
                      <div style={{ padding: '0 24px 20px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          <i className="fas fa-user" style={{ marginRight: 6 }} />Accounts
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', border: '2px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                            <button type="button" onClick={() => updateItem(idx, { quantity: Math.max(1, (item.quantity || 1) - 1) })}
                              style={{ padding: '8px 14px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', color: 'var(--dark-blue)', fontFamily: 'inherit', lineHeight: 1 }}>−</button>
                            <span style={{ padding: '8px 16px', fontWeight: 800, fontSize: '1rem', color: 'var(--dark-blue)', minWidth: 44, textAlign: 'center' }}>{item.quantity || 1}</span>
                            <button type="button" onClick={() => updateItem(idx, { quantity: Math.min(20, (item.quantity || 1) + 1) })}
                              style={{ padding: '8px 14px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', color: 'var(--dark-blue)', fontFamily: 'inherit', lineHeight: 1 }}>+</button>
                          </div>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
                            account{(item.quantity || 1) !== 1 ? 's' : ''} · ₹{(item.price || 0).toLocaleString('en-IN')}/mo each
                          </span>
                        </div>
                      </div>

                      {/* Price breakdown + actions */}
                      <div style={{ padding: '14px 24px', background: 'var(--bg-light)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                          ₹{(item.price || 0).toLocaleString('en-IN')}/mo × {item.quantity || 1} × {item.duration || 1}mo
                          {(item.discountPct || 0) > 0 && <span style={{ marginLeft: 6, color: '#16a34a', fontWeight: 700 }}>− {item.discountPct}%</span>}
                          <span style={{ marginLeft: 6, color: '#f59e0b', fontWeight: 700 }}>+ GST 18%</span>
                          {' = '}
                          <strong style={{ color: accent }}>₹{(Math.round((item.totalAmount || 0) * 1.18)).toLocaleString('en-IN')}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => removeFromCart(idx)} disabled={paying === idx}
                            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <i className="fas fa-trash-alt" style={{ marginRight: 5 }} />Remove
                          </button>
                          <button onClick={() => handleBuyItem(item, idx)} disabled={paying !== null}
                            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: paying === idx ? '#ccc' : accent, color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: paying !== null ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
                            {paying === idx ? <><span className="spinner-sm" />Processing…</> : <><i className="fas fa-bolt" />Buy Now</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button onClick={() => { if (window.confirm('Clear all items from cart?')) clearCart(); }}
                  style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, padding: '4px 0', textDecoration: 'underline' }}>
                  Clear cart
                </button>
              </div>

              {/* ── Order Summary ── */}
              <div style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--border-color)', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', position: 'sticky', top: 100 }}>
                <h3 style={{ margin: '0 0 18px', color: 'var(--dark-blue)', fontWeight: 800, fontSize: '1.05rem' }}>Order Summary</h3>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.82rem' }}>
                    <div style={{ color: 'var(--text-light)', flex: 1, paddingRight: 8 }}>
                      {item.service}
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.planName} · {item.duration}mo · {item.quantity} acc</div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--dark-blue)', whiteSpace: 'nowrap' }}>₹{(item.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 4, borderTop: '1px dashed var(--border-color)', paddingTop: 8 }}>
                  Per-item prices above are excl. GST
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, marginTop: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem', color: 'var(--text-light)' }}>
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {totalSavings > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem', color: '#16a34a', fontWeight: 700 }}>
                      <span>Discount savings</span>
                      <span>−₹{totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.82rem', color: '#f59e0b', fontWeight: 700 }}>
                    <span>GST (18%)</span>
                    <span>+₹{gstTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: 'var(--dark-blue)', borderTop: '2px solid var(--border-color)', paddingTop: 10 }}>
                    <span>Total Payable</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 10, lineHeight: 1.5 }}>GST @18% applied. Pay per service individually. Each activates after payment.</p>
                <Link to="/services" style={{ display: 'block', textAlign: 'center', marginTop: 16, padding: '11px', borderRadius: 10, border: '1.5px solid var(--border-color)', color: 'var(--dark-blue)', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                  + Add More Services
                </Link>
              </div>

            </div>
          )}
        </div>
      </main>
      <Footer />
      <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} />
    </>
  );
}
