import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { inspectionApi, extinguisherApi } from '../services/api.service';
import ConfirmDialog from '../components/ConfirmDialog';
import { getApiErrorMessage } from '../lib/errors';

export default function InspectionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  const isClient = user?.role === 'CLIENT';
  const canCreate = user?.role === 'ADMIN' || user?.role === 'INSPECTOR';
  const [showForm, setShowForm] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    extinguisherCode: '',
    inspectionDate: new Date().toISOString().slice(0, 10),
    condition: 'GOOD',
    remarks: '',
    nextInspectionDate: '',
  });

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => inspectionApi.getAll().then((r) => r.data),
  });

  const { data: extinguishers = [] } = useQuery({
    queryKey: ['ext-for-inspection'],
    queryFn: () => extinguisherApi.getAll().then((r) => r.data),
    enabled: canCreate,
  });

  const createMut = useMutation({
    mutationFn: () =>
      inspectionApi.create({
        ...form,
        inspectorId: user!.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inspections'] });
      setShowForm(false);
      setConfirmSubmit(false);
      setError('');
    },
    onError: (e) => setError(getApiErrorMessage(e, 'Failed to create inspection')),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => inspectionApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inspections'] });
      setDeleteId(null);
    },
  });

  const submitInspection = () => createMut.mutate();

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">{isClient ? 'Inspection History' : 'Inspections'}</h1>
        {canCreate && (
          <button onClick={() => setShowForm(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
            New Inspection
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmSubmit(true);
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
            <span className="text-sm font-medium text-gray-700">Inspection Date *</span>
            <input
              type="date"
              value={form.inspectionDate}
              onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Condition *</span>
            <select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            >
              {['GOOD', 'FAIR', 'POOR', 'CRITICAL'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Next Inspection Date *</span>
            <input
              type="date"
              value={form.nextInspectionDate}
              onChange={(e) => setForm({ ...form, nextInspectionDate: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              required
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Remarks</span>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              rows={2}
              placeholder="Optional notes about this inspection"
            />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
              Submit Inspection
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
                {['Code', 'Date', 'Condition', 'Next Due', 'Remarks', isAdmin ? 'Actions' : ''].filter(Boolean).map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {inspections.map((insp) => (
                <tr key={insp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{insp.extinguisherCode}</td>
                  <td className="px-4 py-3">{new Date(insp.inspectionDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{insp.condition}</td>
                  <td className="px-4 py-3">{new Date(insp.nextInspectionDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600">{insp.remarks || '—'}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <button onClick={() => setDeleteId(insp.id)} className="text-red-600">
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {inspections.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No inspection records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmSubmit}
        title="Submit Inspection"
        message="Are you sure you want to perform this action?"
        onConfirm={submitInspection}
        onCancel={() => setConfirmSubmit(false)}
      />
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete Inspection"
        message="Are you sure you want to perform this action?"
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
