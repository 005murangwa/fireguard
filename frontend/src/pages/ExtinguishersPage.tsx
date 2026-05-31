import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { extinguisherApi, userApi } from '../services/api.service';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatStatus } from '../types';
import type { User } from '../types';
import { getApiErrorMessage } from '../lib/errors';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-red-100 text-red-800',
  UNDER_MAINTENANCE: 'bg-blue-100 text-blue-800',
  INSPECTION_DUE: 'bg-yellow-100 text-yellow-800',
};

const STATUS_OPTIONS = ['', 'ACTIVE', 'EXPIRED', 'UNDER_MAINTENANCE', 'INSPECTION_DUE'];

export default function ExtinguishersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  const isClient = user?.role === 'CLIENT';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [scanCode, setScanCode] = useState('');
  const [scanResult, setScanResult] = useState('');
  const [form, setForm] = useState({
    extinguisherCode: '',
    type: '',
    manufacturer: '',
    capacity: '',
    installationLocation: '',
    manufacturingDate: '',
    expirationDate: '',
    assignedClientId: '' as string | number,
  });
  const [error, setError] = useState('');

  const { data: clientUsers = [] } = useQuery({
    queryKey: ['users', 'clients'],
    queryFn: () => userApi.getAll({ role: 'CLIENT', limit: '100' }).then((r) => r.data as User[]),
    enabled: showForm && isAdmin,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['extinguishers', page, search, statusFilter],
    queryFn: () =>
      extinguisherApi.getAll({
        page: String(page),
        limit: '10',
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
  });

  const items = response?.data ?? [];
  const totalPages = response?.meta?.totalPages ?? 1;

  const buildCreatePayload = () => {
    const payload: Record<string, string | number> = {
      type: form.type.trim(),
      manufacturer: form.manufacturer.trim(),
      capacity: form.capacity.trim(),
      installationLocation: form.installationLocation.trim(),
      manufacturingDate: form.manufacturingDate,
      expirationDate: form.expirationDate,
    };
    if (form.extinguisherCode.trim()) payload.extinguisherCode = form.extinguisherCode.trim();
    const clientId = Number(form.assignedClientId);
    if (clientId > 0) payload.assignedClientId = clientId;
    return payload;
  };

  const createMut = useMutation({
    mutationFn: () => extinguisherApi.create(buildCreatePayload()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['extinguishers'] });
      setShowForm(false);
      setError('');
      setForm({
        extinguisherCode: '',
        type: '',
        manufacturer: '',
        capacity: '',
        installationLocation: '',
        manufacturingDate: '',
        expirationDate: '',
        assignedClientId: '',
      });
    },
    onError: (e) => setError(getApiErrorMessage(e, 'Failed to register extinguisher')),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => extinguisherApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['extinguishers'] });
      setDeleteId(null);
    },
  });

  const handleScan = async () => {
    try {
      const res = await extinguisherApi.scan(scanCode);
      setScanResult(JSON.stringify(res.data, null, 2));
    } catch {
      setScanResult('Not found');
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isClient ? 'My Fire Extinguishers' : 'Fire Extinguishers'}</h1>
          {isClient && (
            <p className="text-sm text-gray-500 mt-1">
              Units assigned to your account by FireGuard LTD admin. Status updates appear here and in Notifications.
            </p>
          )}
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
            Register
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search code, type, location..."
          className="px-3 py-2 border rounded-lg flex-1 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {formatStatus(s)}
            </option>
          ))}
        </select>
        <input
          value={scanCode}
          onChange={(e) => setScanCode(e.target.value)}
          placeholder="Scan QR / enter code"
          className="px-3 py-2 border rounded-lg flex-1 min-w-[160px] max-w-xs"
        />
        <button onClick={handleScan} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
          Scan QR
        </button>
      </div>
      {scanResult && <pre className="bg-gray-50 p-3 rounded-lg text-xs mb-4 overflow-auto">{scanResult}</pre>}

      {showForm && isAdmin && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
          className="bg-white border rounded-xl p-6 mb-6 grid md:grid-cols-2 gap-4"
        >
          {error && <div className="md:col-span-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Extinguisher Code (optional — auto-generated if blank)</span>
            <input
              value={form.extinguisherCode}
              onChange={(e) => setForm({ ...form, extinguisherCode: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              placeholder="e.g. FE-2026-001"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Type *</span>
            <input
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              placeholder="CO2, Foam, Dry Powder..."
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Manufacturer *</span>
            <input
              value={form.manufacturer}
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Capacity *</span>
            <input
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              placeholder="e.g. 5kg, 9L"
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Installation Location *</span>
            <input
              value={form.installationLocation}
              onChange={(e) => setForm({ ...form, installationLocation: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              placeholder="Building, floor, room..."
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Manufacturing Date *</span>
            <input
              type="date"
              value={form.manufacturingDate}
              onChange={(e) => setForm({ ...form, manufacturingDate: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Expiration Date *</span>
            <input
              type="date"
              value={form.expirationDate}
              onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Assign to Client (optional)</span>
            <select
              value={form.assignedClientId}
              onChange={(e) => setForm({ ...form, assignedClientId: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            >
              <option value="">— No client —</option>
              {clientUsers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.email}) — ID {c.id}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2 flex gap-2">
            <button type="submit" disabled={createMut.isPending} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              {createMut.isPending ? 'Registering...' : 'Register Extinguisher (+ QR)'}
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
        <>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Type', 'Manufacturer', 'Location', 'Expiry', 'Status', isAdmin ? 'Actions' : '']
                    .filter(Boolean)
                    .map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs uppercase text-gray-500">
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.extinguisherCode}</td>
                    <td className="px-4 py-3">{item.type}</td>
                    <td className="px-4 py-3">{item.manufacturer}</td>
                    <td className="px-4 py-3">{item.installationLocation}</td>
                    <td className="px-4 py-3">{new Date(item.expirationDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[item.status]}`}>
                        {formatStatus(item.status)}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button onClick={() => setDeleteId(item.id)} className="text-red-600">
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      {isClient
                        ? 'No extinguishers assigned yet. Ask your FireGuard LTD admin to register units and assign them to your account.'
                        : 'No extinguishers found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete Extinguisher"
        message="Are you sure you want to perform this action?"
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
