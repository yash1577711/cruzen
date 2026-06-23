import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../api/axios.js';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { setSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');
    const isNew = searchParams.get('new') === 'true';

    if (!token || !refresh) {
      toast.error('Authentication failed.');
      navigate('/login');
      return;
    }

    // Fetch user data with the new token
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refresh);

    api.get('/auth/me')
      .then(({ data }) => {
        setSession(token, refresh, data.user);
        if (isNew) toast.success('Welcome to Cruzen Digital! 🎉');
        else toast.success('Welcome back!');
        const role = data.user.role;
        const dest = ['admin', 'sub-admin'].includes(role) ? '/admin' : '/dashboard';
        navigate(dest, { replace: true });
      })
      .catch(() => {
        toast.error('Authentication error. Please try again.');
        navigate('/login');
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-light)', fontWeight: 600 }}>Completing sign-in...</p>
    </div>
  );
}
