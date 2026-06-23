import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AdminLayout } from './AdminDashboard.jsx';
import api from '../../api/axios.js';

const STATUS_COLORS = { pending: '#f59e0b', paid: '#1dbf73', active: '#00B4CC', completed: '#6366f1', cancelled: '#ef4444', refunded: '#a855f7' };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [posHeads, setPosHeads] = useState([]);
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    api.get('/orders/all', { params })
      .then(r => { setOrders(r.data.orders || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
    api.get('/admin/pos-heads').then(r => setPosHeads(r.data.heads || [])).catch(() => {});
  }, [statusFilter]);

  const handleAssignPos = async (orderId, posHeadId) => {
    if (!posHeadId) return;
    setAssigningId(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/assign-pos`, { posHeadId });
      toast.success('POS Head assigned!');
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, posHead: posHeads.find(p => p._id === posHeadId) } : o));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setAssigningId(null);
  };

  const totalRevenue = orders.filter(o => ['active', 'completed', 'paid'].includes(o.status)).reduce((s, o) => s + o.amount, 0);

  return (
    <AdminLayout title="Orders Management" subtitle={`${total} total orders · ₹${totalRevenue.toLocaleString('en-IN')} revenue`}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'pending', 'active', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid var(--border-color)', background: statusFilter === s ? 'var(--dark-blue)' : '#fff', color: statusFilter === s ? '#fff' : 'var(--text-main)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', overflowX: 'auto' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)', borderBottom: '1px solid var(--border-color)' }}>
                {['Invoice', 'Client', 'Service', 'Plan', 'Amount', 'Status', 'POS Head', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>No orders found.</td></tr>
              ) : orders.map(order => (
                <tr key={order._id} style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--secondary-color)', fontWeight: 600 }}>{order.invoiceNumber}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--dark-blue)' }}>{order.user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{order.user?.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--dark-blue)', fontWeight: 600 }}>{order.service?.title || order.serviceName || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-light)' }}>{order.planName}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--dark-blue)' }}>₹{order.amount?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: `${STATUS_COLORS[order.status]}18`, color: STATUS_COLORS[order.status], padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize' }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {order.posHead ? (
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--secondary-color)', fontWeight: 600, marginBottom: 3 }}>{order.posHead.name}</div>
                        <select value="" disabled={assigningId === order._id}
                          onChange={e => handleAssignPos(order._id, e.target.value)}
                          style={{ fontSize: '0.7rem', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: 6, fontFamily: 'inherit', background: '#f8fafc', cursor: 'pointer', maxWidth: 120, color: 'var(--text-light)' }}>
                          <option value="">Reassign…</option>
                          {posHeads.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <select disabled={assigningId === order._id} defaultValue=""
                        onChange={e => handleAssignPos(order._id, e.target.value)}
                        style={{ fontSize: '0.75rem', padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: 6, fontFamily: 'inherit', background: '#fff', cursor: 'pointer', maxWidth: 140 }}>
                        <option value="">Assign POS…</option>
                        {posHeads.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
