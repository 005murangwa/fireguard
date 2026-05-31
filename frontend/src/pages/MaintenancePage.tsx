import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { maintenanceApi, extinguisherApi } from '../services/api.service';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatStatus } from '../types';
import { getApiErrorMessage } from '../lib/errors';

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function MaintenancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  const isClient = user?.role === 'CLIENT';
  const canManage = isAdmin || user?.role === 'INSPECTOR';
  const [showForm, setShowForm] = useState(false);
  const [completeId, setCompleteId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    extinguisherCode: '',
    maintenanceDate: new Date().toISOString().slice(0, 10),
    description: '',
    technician: '',
    status: 'SCHEDULED' as const,
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => maintenanceApi.getAll().then((r) => r.data),
  });

  const { data: extinguishers = [] } = useQuery({
    queryKey: ['ext-for-maintenance'],
    queryFn: () => extinguisherApi.getAll().then((r) => r.data),
    enabled: canManage,
  });

  const createMut = useMutation({
    mutationFn: () => maintenanceApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      setShowForm(false);
      setError('');
    },
    onError: (e) => setError(getApiErrorMessage(e, 'Failed to create maintenance record')),
  });

  const completeMut = useMutation({
    mutationFn: (id: number) => maintenanceApi.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      setCompleteId(null);
    },
  });

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">{isClient ? 'Maintenance History' : 'Maintenance'}</h1>
        {canManage && (
          <button onClick={() => setShowForm(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
            Schedule Maintenance
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
          className="bg-white border rounded-xl p-6 mb-6 grid md:grid-cols-2 gap-4"
        >
          {error && <div className="md:col-span-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Fire Extinguisher *</span>
            <select
              value={form.extinguisherCode}
              onChange={(e) => setForm({ ...form, extinguisherCode: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Select extinguisher</option>
              {extinguishers.map((ex) => (
                <option key={ex.id} value={ex.extinguisherCode}>
                  {ex.extinguisherCode} — {ex.installationLocation}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Maintenance Date *</span>
            <input
              type="date"
              value={form.maintenanceDate}
              onChange={(e) => setForm({ ...form, maintenanceDate: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Technician *</span>
            <input
              value={form.technician}
              onChange={(e) => setForm({ ...form, technician: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              placeholder="Technician name"
              required
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Description *</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              rows={2}
              placeholder="Work to be performed or performed"
              required
            />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
              Create
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-b-2 border-red-600 rounded-full" />
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Code', 'Date', 'Technician', 'Description', 'Status', canManage ? 'Actions' : ''].filter(Boolean).map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{rec.extinguisherCode}</td>
                  <td className="px-4 py-3">{new Date(rec.maintenanceDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{rec.technician}</td>
                  <td className="px-4 py-3 text-gray-600">{rec.description}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[rec.status]}`}>
                      {formatStatus(rec.status)}
                    </span>
                  </td>
                  {canManage && rec.status !== 'COMPLETED' && (
                    <td className="px-4 py-3">
                      <button onClick={() => setCompleteId(rec.id)} className="text-green-600">
                        Complete
                      </button>
                    </td>
                  )}
                  {canManage && rec.status === 'COMPLETED' && <td className="px-4 py-3">—</td>}
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No maintenance records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={completeId !== null}
        title="Complete Maintenance"
        message="Are you sure you want to perform this action?"
        onConfirm={() => completeId && completeMut.mutate(completeId)}
        onCancel={() => setCompleteId(null)}
      />
    </div>
  );
}
