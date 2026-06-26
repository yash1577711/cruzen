import { useSearchParams, Link } from 'react-router-dom';

export default function PaymentFailed() {
  const [params] = useSearchParams();
  const reason = params.get('reason') || 'Your payment could not be processed.';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#060b1f', padding: '32px 16px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '48px 40px', maxWidth: '480px', width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>❌</div>
        <h1 style={{ color: '#fff', fontSize: '1.8rem', margin: '0 0 12px', fontWeight: 700 }}>
          Payment Failed
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 28px', lineHeight: 1.6 }}>
          {reason}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: '0 0 32px' }}>
          No amount has been deducted. You can try again or contact support if the issue persists.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/services" style={{
            background: 'linear-gradient(135deg,#15D8E1,#0aa8b0)', color: '#060b1f',
            padding: '12px 28px', borderRadius: '50px', fontWeight: 700,
            textDecoration: 'none', fontSize: '0.95rem',
          }}>
            Try Again
          </Link>
          <Link to="/contact" style={{
            background: 'transparent', color: '#15D8E1',
            padding: '12px 28px', borderRadius: '50px', fontWeight: 600,
            textDecoration: 'none', fontSize: '0.95rem',
            border: '1px solid rgba(21,216,225,0.4)',
          }}>
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
