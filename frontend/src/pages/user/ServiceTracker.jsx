import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import api from '../../api/axios.js';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;

const STATUS_COLORS = { 'not-started': '#64748b', 'in-progress': '#f59e0b', review: '#00B4CC', completed: '#1dbf73', 'on-hold': '#ef4444' };
const STATUS_LABELS = { 'not-started': 'Not Started', 'in-progress': 'In Progress', review: 'Under Review', completed: 'Completed', 'on-hold': 'On Hold' };

export default function ServiceTracker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!id) { navigate('/dashboard'); return; }
    api.get(`/tracker/${id}`)
      .then(r => setTracker(r.data.tracker))
      .catch(() => { toast.error('Could not load tracker.'); navigate('/dashboard'); })
      .finally(() => setLoading(false));

    const token = localStorage.getItem('accessToken');
    if (token) {
      const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;
      socket.on('connect_error', () => {});
      socket.on('tracker_updated', (data) => {
        if (data.trackerId === id) {
          setTracker(prev => prev ? {
            ...prev,
            progressPercent: data.progressPercent,
            overallStatus: data.overallStatus,
            updates: data.updates,
          } : prev);
        }
      });
    }
    return () => socketRef.current?.disconnect();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  if (!tracker) return null;

  const visibleUpdates = (tracker.updates || []).filter(u => u.isVisibleToUser !== false);
  const statusColor = STATUS_COLORS[tracker.overallStatus] || '#64748b';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      {/* Header */}
      <div style={{ background: 'var(--dark-blue)', color: '#fff', padding: '20px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <Link to="/dashboard" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>{tracker.service?.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Plan: {tracker.order?.planName}</p>
            </div>
            <span style={{ background: `${statusColor}25`, color: '#fff', border: `1px solid ${statusColor}`, padding: '6px 16px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize' }}>
              {STATUS_LABELS[tracker.overallStatus]}
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Progress Card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '28px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '1.1rem' }}>Overall Progress</h2>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: statusColor }}>{tracker.progressPercent}%</span>
          </div>
          <div style={{ height: 10, background: 'var(--bg-light)', borderRadius: 5, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ height: '100%', width: `${tracker.progressPercent}%`, background: 'var(--gradient-primary)', borderRadius: 5, transition: 'width 1s ease' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: '14px', background: 'var(--bg-light)', borderRadius: 10 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Start Date</div>
              <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.9rem' }}>
                {tracker.startDate ? new Date(tracker.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '14px', background: 'var(--bg-light)', borderRadius: 10 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Est. Completion</div>
              <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.9rem' }}>
                {tracker.estimatedCompletionDate ? new Date(tracker.estimatedCompletionDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '14px', background: 'var(--bg-light)', borderRadius: 10 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Updates</div>
              <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.9rem' }}>{visibleUpdates.length}</div>
            </div>
            {tracker.assignedTo && (
              <div style={{ textAlign: 'center', padding: '14px', background: 'var(--bg-light)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Account Manager</div>
                <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.9rem' }}>{tracker.assignedTo?.name}</div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '28px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '1.1rem', marginBottom: 24 }}>Progress Timeline</h2>

          {visibleUpdates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-light)' }}>
              <i className="fas fa-clock" style={{ fontSize: '2rem', opacity: 0.3, display: 'block', marginBottom: 12 }}></i>
              <p style={{ fontWeight: 600 }}>Your project has just started!</p>
              <p style={{ fontSize: '0.85rem' }}>Updates will appear here as our team makes progress.</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: 'var(--border-color)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[...visibleUpdates].reverse().map((update, i) => (
                  <div key={update._id || i} style={{ display: 'flex', gap: 20, paddingBottom: 24, position: 'relative' }}>
                    {/* Dot */}
                    <div style={{ flexShrink: 0, zIndex: 1 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: i === 0 ? 'var(--gradient-primary)' : '#fff', border: `2px solid ${i === 0 ? 'transparent' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? '#fff' : 'var(--text-light)', fontSize: '0.8rem', boxShadow: i === 0 ? 'var(--shadow-md)' : 'none' }}>
                        <i className={`fas fa-${i === 0 ? 'star' : 'check'}`}></i>
                      </div>
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, background: i === 0 ? 'rgba(29,191,115,0.04)' : 'var(--bg-light)', borderRadius: 12, padding: '16px 18px', border: `1px solid ${i === 0 ? 'rgba(29,191,115,0.2)' : 'var(--border-color)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.9rem' }}>{update.title}</div>
                        {i === 0 && <span style={{ background: 'rgba(29,191,115,0.1)', color: '#1dbf73', padding: '2px 8px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Latest</span>}
                      </div>
                      <p style={{ color: 'var(--text-main)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 8 }}>{update.description}</p>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                        {new Date(update.createdAt).toLocaleString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Support CTA */}
        <div style={{ background: 'var(--gradient-primary)', borderRadius: 16, padding: '28px', marginTop: 24, color: '#fff', textAlign: 'center' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Have a question about your project?</h3>
          <p style={{ opacity: 0.85, fontSize: '0.9rem', marginBottom: 16 }}>Our team is here to help. Reach out to us anytime.</p>
          <a href="mailto:hello@cruzendigital.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: 'var(--dark-blue)', padding: '10px 24px', borderRadius: 25, textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
            <i className="fas fa-envelope"></i> Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
