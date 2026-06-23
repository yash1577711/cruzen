import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios.js';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! Welcome to Cruzen Digital 👋\n\nI can help you with:\n• Services & Pricing\n• Amazon / Flipkart / Marketplace\n• SEO, Social Media & Google Ads\n• Website & Shopify Development\n• Book a Free Consultation\n\nAsk me anything — Hindi ya English, dono chalega! 😊' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('sessionId');
    if (stored) return stored;
    const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
    localStorage.setItem('sessionId', id);
    return id;
  });
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!open && messages.length > 1) setUnread(u => u + 1);
    if (open) setUnread(0);
  }, [messages.length]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chat/message', { message: text, sessionId });
      setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I\'m having trouble right now. Please call us at 08062180749.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const quickReplies = ['All Services', 'Pricing Overview', 'Amazon Management', 'SEO & Google Ads', 'Book Free Consultation'];

  return (
    <>
      {/* WhatsApp Button — stacked above chatbot FAB */}
      <a
        href="https://wa.me/919560310393"
        target="_blank"
        rel="noopener noreferrer"
        title="Chat on WhatsApp"
        className="wa-fab"
        style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 9999,
          width: 52, height: 52, borderRadius: '50%',
          background: '#25D366',
          border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,211,102,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', color: '#fff', textDecoration: 'none',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,211,102,0.55)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,0.45)'; }}
      >
        <i className="fab fa-whatsapp"></i>
      </a>

      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="chatbot-fab"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #15d8e1, #15d8e1)',
          border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(21,216,225,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          fontSize: '1.3rem', color: '#fff',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <i className={open ? 'fas fa-times' : 'fas fa-comments'}></i>
        {!open && unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, background: '#ef4444',
            color: '#fff', borderRadius: '50%', width: 20, height: 20,
            fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unread}</span>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 9999,
          width: 360, maxWidth: 'calc(100vw - 32px)', maxHeight: 520,
          background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(2,43,80,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
          border: '1px solid var(--border-color)',
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #022B50, #0f3d6c)', padding: '16px 20px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #15d8e1, #15d8e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                <i className="fas fa-robot"></i>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cruzen AI Assistant</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  <span style={{ color: '#15d8e1', marginRight: 6 }}>●</span>Online — typically replies instantly
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'bot' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', flexShrink: 0, marginRight: 8, marginTop: 4 }}>
                    <i className="fas fa-robot"></i>
                  </div>
                )}
                <div style={{
                  maxWidth: '78%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #15d8e1, #15d8e1)' : 'var(--bg-light)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
                  fontSize: '0.875rem', lineHeight: 1.5,
                  border: msg.role === 'bot' ? '1px solid var(--border-color)' : 'none',
                  whiteSpace: 'pre-line',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: 'var(--bg-light)', borderRadius: '18px 18px 18px 4px', width: 'fit-content', border: '1px solid var(--border-color)' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-light)', animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length < 3 && (
            <div style={{ padding: '8px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {quickReplies.map(qr => (
                <button key={qr} onClick={async () => {
                  setMessages(prev => [...prev, { role: 'user', text: qr }]);
                  setLoading(true);
                  try {
                    const { data } = await api.post('/chat/message', { message: qr, sessionId });
                    setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
                  } catch {
                    setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, something went wrong. Please call us at 08062180749.' }]);
                  } finally {
                    setLoading(false);
                  }
                }}
                  style={{
                    padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border-color)',
                    background: '#fff', color: 'var(--secondary-color)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s', fontFamily: 'inherit',
                  }}>
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 50, border: '1px solid var(--border-color)',
                outline: 'none', fontSize: '0.875rem', background: 'var(--bg-light)',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--secondary-color)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: input.trim() ? 'linear-gradient(135deg, #15d8e1, #15d8e1)' : 'var(--bg-light)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                color: input.trim() ? '#fff' : 'var(--text-light)', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <i className="fas fa-paper-plane" style={{ fontSize: '0.85rem' }}></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
