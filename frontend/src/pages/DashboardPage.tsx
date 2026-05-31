import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { dashboardApi, extinguisherApi, notificationApi } from '../services/api.service';

function Stat({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const { data: adminStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
    enabled: isAdmin && isAuthenticated,
  });

  const { data: clientData } = useQuery({
    queryKey: ['client-dashboard', user?.id],
    queryFn: async () => {
      const [extinguishers, notifications] = await Promise.all([
        extinguisherApi.getAll().then((r) => r.data),
        notificationApi.getAll().then((r) => r.data),
      ]);
      return { extinguishers, notifications };
    },
    enabled: !isAdmin && isAuthenticated && !!user,
  });

  if (isAdmin) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Stat title="Total Users" value={adminStats?.totalUsers ?? 0} icon="👥" />
          <Stat title="Total Extinguishers" value={adminStats?.totalExtinguishers ?? 0} icon="🧯" />
          <Stat title="Active" value={adminStats?.activeExtinguishers ?? 0} icon="✅" />
          <Stat title="Expired" value={adminStats?.expiredExtinguishers ?? 0} icon="❌" />
          <Stat title="Upcoming Expirations (30d)" value={adminStats?.upcomingExpirations ?? 0} icon="⏳" />
          <Stat title="Inspection Due" value={adminStats?.pendingInspections ?? 0} icon="🔍" />
          <Stat title="Notifications" value={adminStats?.notificationsSent ?? 0} icon="🔔" />
        </div>
      </div>
    );
  }

  const extinguishers = Array.isArray(clientData?.extinguishers) ? clientData.extinguishers : [];
  const notifications = Array.isArray(clientData?.notifications) ? clientData.notifications : [];
  const roleTitle = user?.role === 'INSPECTOR' ? 'Inspector Dashboard' : 'Client Dashboard';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{roleTitle}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Stat title="My Extinguishers" value={extinguishers.length} icon="🧯" />
        <Stat title="Expiring Soon" value={extinguishers.filter((e) => e.status === 'INSPECTION_DUE').length} icon="⚠️" />
        <Stat title="Unread Notifications" value={notifications.filter((n) => !n.isRead).length} icon="🔔" />
      </div>
    </div>
  );
}
