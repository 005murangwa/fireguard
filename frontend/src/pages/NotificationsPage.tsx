import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { notificationApi } from '../services/api.service';
import { getApiErrorMessage } from '../lib/errors';

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll().then((r) => r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const runCronMutation = useMutation({
    mutationFn: () => notificationApi.runCron(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      const r = response.data as { processed?: number; sent?: number; skipped?: number };
      setActionMessage(`Cron completed. Sent: ${r.sent ?? 0}, skipped: ${r.skipped ?? 0}.`);
      setActionError('');
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Cron job failed')),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {isAdmin && (
          <button
            onClick={() => runCronMutation.mutate()}
            disabled={runCronMutation.isPending}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {runCronMutation.isPending ? 'Running...' : 'Run Daily Cron'}
          </button>
        )}
      </div>

      {actionMessage && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{actionMessage}</div>}
      {actionError && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{actionError}</div>}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {notifications.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{n.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{n.message}</td>
                  <td className="px-6 py-4 text-sm">{new Date(n.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        n.isRead ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {n.isRead ? 'Read' : 'Unread'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {!n.isRead && (
                      <button onClick={() => markReadMutation.mutate(n.id)} className="text-blue-600 hover:underline">
                        Mark as Read
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No notifications yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
