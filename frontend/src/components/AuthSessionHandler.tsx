import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/** Listens for session expiry and navigates to login without a full page reload. */
export default function AuthSessionHandler() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const onSessionExpired = () => {
      logout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:session-expired', onSessionExpired);
    return () => window.removeEventListener('auth:session-expired', onSessionExpired);
  }, [logout, navigate]);

  return null;
}
