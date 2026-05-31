import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RoleRouteProps {
  roles: Array<'ADMIN' | 'INSPECTOR' | 'CLIENT'>;
  children: React.ReactNode;
}

export default function RoleRoute({ roles, children }: RoleRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
