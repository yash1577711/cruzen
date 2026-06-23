import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AdminRoute({ children, requireAdmin = false }) {
  const { user, loading, isStaff, isAdmin } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user || !isStaff) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/admin" replace />;

  return children;
}
