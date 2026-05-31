import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ConfirmDialog from './ConfirmDialog';

const adminNav = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/orders', label: 'Orders', icon: '🛒' },
  { path: '/extinguishers', label: 'Extinguishers', icon: '🧯' },
  { path: '/inspections', label: 'Inspections', icon: '🔍' },
  { path: '/maintenance', label: 'Maintenance', icon: '🔧' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
  { path: '/reports', label: 'Reports', icon: '📄' },
];

const inspectorNav = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/extinguishers', label: 'Extinguishers', icon: '🧯' },
  { path: '/inspections', label: 'Inspections', icon: '🔍' },
  { path: '/maintenance', label: 'Maintenance', icon: '🔧' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
];

const clientNav = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/orders', label: 'Order Extinguishers', icon: '🛒' },
  { path: '/extinguishers', label: 'My Extinguishers', icon: '🧯' },
  { path: '/staff', label: 'Our Staff', icon: '👔' },
  { path: '/inspections', label: 'Inspection History', icon: '🔍' },
  { path: '/maintenance', label: 'Maintenance History', icon: '🔧' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const nav = user?.role === 'ADMIN' ? adminNav : user?.role === 'INSPECTOR' ? inspectorNav : clientNav;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h1 className="font-bold text-gray-900">FireGuard LTD</h1>
          <p className="text-xs text-gray-500">{user?.role} Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${location.pathname === item.path ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
          <button onClick={() => setConfirmLogout(true)} className="mt-2 w-full text-sm text-red-600 hover:bg-red-50 py-2 rounded-lg">Logout</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
      <ConfirmDialog isOpen={confirmLogout} title="Logout" message="Are you sure you want to perform this action?"
        onConfirm={() => { logout(); navigate('/login'); setConfirmLogout(false); }} onCancel={() => setConfirmLogout(false)} />
    </div>
  );
}
