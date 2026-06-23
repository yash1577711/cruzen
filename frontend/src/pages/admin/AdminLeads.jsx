import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AdminLayout } from './AdminDashboard.jsx';
import api from '../../api/axios.js';

const SOURCES = ['all', 'buy_now', 'consultation', 'contact_form', 'exit_intent', 'sticky_bar', 'services_popup', 'about_popup', 'portfolio_popup', 'blog_newsletter', 'chatbot', 'signup', 'page_visit', 'service_click', 'payment_intent'];
const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];
const STATUS_COLORS = { new: '#f59e0b', contacted: '#00B4CC', qualified: '#6366f1', converted: '#1dbf73', lost: '#ef4444' };

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', source: '', search: '' });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter.status) params.status = filter.status;
      if (filter.source && filter.source !== 'all') params.source = filter.source;
      if (filter.search) params.search = filter.search;
      const { data } = await api.get('/leads', { params });
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load leads.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, [page, filter.status, filter.source]);

  const handleSearch = (e) => { if (e.key === 'Enter') fetchLeads(); };

  const updateLead = async (id, updateData) => {
    setUpdating(true);
    try {
      const { data } = await api.patch(`/leads/${id}`, updateData);
      setLeads(prev => prev.map(l => l._id === id ? data.lead : l));
      if (selected?._id === id) setSelected(data.lead);
      toast.success('Lead updated.');
    } catch { toast.error('Failed to update lead.'); }
    finally { setUpdating(false); }
  };

  const stats = STATUSES.map(s => ({ status: s, count: leads.filter(l => l.status === s).length }));

  return (
    <AdminLayout title="Leads Management" subtitle={`${total} total leads tracked from all sources.`}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {stats.map(s => (
          <div key={s.status} style={{ background: '#fff', borderRadius: 10, padding: '12px 20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s.status], display: 'inline-block' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark-blue)', textTransform: 'capitalize' }}>{s.status}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: STATUS_COLORS[s.status] }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid var(--border-color)', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Search by name, email or phone..."
          value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} onKeyDown={handleSearch}
          style={{ padding: '8px 14px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', flex: '1 1 160px', minWidth: 0 }} />
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          style={{ padding: '8px 14px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', color: 'var(--text-main)' }}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
        </select>
        <select value={filter.source} onChange={e => setFilter(f => ({ ...f, source: e.target.value }))}
          style={{ padding: '8px 14px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', color: 'var(--text-main)' }}>
          {SOURCES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s === 'all' ? 'All Sources' : s.replace('_', ' ')}</option>)}
        </select>
        <button className="btn btn-consult" style={{ padding: '8px 20px', fontSize: '0.85rem' }} onClick={fetchLeads}>
          <i className="fas fa-search"></i> Search
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(0,1fr) 380px' : '1fr', gap: 20, flexWrap: 'wrap' }}>
        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
          {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: 'var(--bg-light)', borderBottom: '1px solid var(--border-color)' }}>
                  {['Name', 'Contact', 'Source', 'Service', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>No leads found.</td></tr>
                ) : leads.map(lead => (
                  <tr key={lead._id} style={{ borderBottom: '1px solid var(--border-color)', background: selected?._id === lead._id ? 'rgba(0,180,204,0.04)' : '' }}
                    onMouseEnter={e => { if (selected?._id !== lead._id) e.currentTarget.style.background = 'var(--bg-light)'; }}
                    onMouseLeave={e => { if (selected?._id !== lead._id) e.currentTarget.style.background = ''; }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--dark-blue)', fontSize: '0.875rem' }}>{lead.name || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{lead.email || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{lead.phone || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: 'rgba(0,180,204,0.1)', color: 'var(--secondary-color)', padding: '3px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>
                        {lead.source?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>{lead.service || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <select value={lead.status} onChange={e => updateLead(lead._id, { status: e.target.value })} disabled={updating}
                        style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${STATUS_COLORS[lead.status]}`, color: STATUS_COLORS[lead.status], fontWeight: 700, fontSize: '0.75rem', background: `${STATUS_COLORS[lead.status]}18`, cursor: 'pointer', outline: 'none' }}>
                        {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => setSelected(selected?._id === lead._id ? null : lead)}
                        style={{ background: 'rgba(0,180,204,0.1)', border: 'none', color: 'var(--secondary-color)', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                        {selected?._id === lead._id ? 'Close' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, color: 'var(--dark-blue)' }}>Lead Details</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '1.2rem' }}>×</button>
            </div>
            {[
              { label: 'Name', value: selected.name },
              { label: 'Email', value: selected.email },
              { label: 'Phone', value: selected.phone },
              { label: 'Source', value: selected.source?.replace(/_/g, ' ') },
              { label: 'Service', value: selected.service },
              { label: 'Message', value: selected.message },
              { label: 'Date', value: new Date(selected.createdAt).toLocaleString('en-IN') },
              { label: 'Page URL', value: selected.pageUrl },
              { label: 'IP Address', value: selected.ipAddress },
            ].map(item => item.value && (
              <div key={item.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dark-blue)', fontWeight: 500, textTransform: ['Message','Page URL'].includes(item.label) ? 'none' : 'capitalize', wordBreak: 'break-word' }}>{item.value}</div>
              </div>
            ))}
            {selected.consultationDate && (
              <div style={{ background: 'rgba(0,180,204,0.06)', border: '1px solid rgba(0,180,204,0.2)', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-color)' }}>CONSULTATION SLOT</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dark-blue)', marginTop: 4 }}>
                  {new Date(selected.consultationDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} · {selected.consultationTime}
                </div>
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', display: 'block', marginBottom: 6 }}>INTERNAL NOTES</label>
              <textarea rows={3} defaultValue={selected.notes || ''} onBlur={e => updateLead(selected._id, { notes: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.85rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                placeholder="Add notes about this lead..." />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
