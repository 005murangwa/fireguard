import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { orderApi } from '../services/api.service';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatStatus } from '../types';
import type { CatalogItem, PurchaseOrder } from '../types';
import { getApiErrorMessage } from '../lib/errors';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  const isClient = user?.role === 'CLIENT';
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveId, setApproveId] = useState<number | null>(null);

  const { data: catalog = [], isLoading: catalogLoading } = useQuery({
    queryKey: ['order-catalog'],
    queryFn: () => orderApi.getCatalog().then((r) => r.data),
    enabled: isClient,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.getAll().then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: () => {
      const items = Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([extinguisherType, quantity]) => ({ extinguisherType, quantity }));
      return orderApi.create({ items, notes: notes.trim() || undefined });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setCart({});
      setNotes('');
      setError('');
    },
    onError: (e) => setError(getApiErrorMessage(e, 'Failed to submit order')),
  });

  const approveMut = useMutation({
    mutationFn: (id: number) => orderApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setApproveId(null);
    },
    onError: (e) => setError(getApiErrorMessage(e, 'Failed to approve order')),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: number; rejectionReason: string }) =>
      orderApi.reject(id, rejectionReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setRejectId(null);
      setRejectReason('');
    },
    onError: (e) => setError(getApiErrorMessage(e, 'Failed to reject order')),
  });

  const updateQty = (type: string, delta: number) => {
    setCart((prev) => {
      const next = Math.max(0, (prev[type] || 0) + delta);
      return { ...prev, [type]: next };
    });
  };

  const cartTotal = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartValue = catalog.reduce((sum, item) => sum + (cart[item.type] || 0) * item.unitPrice, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{isAdmin ? 'Purchase Orders' : 'Order Extinguishers'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isClient
            ? 'Browse available FireGuard LTD units, add to your order, and submit for admin approval.'
            : 'Review and approve client purchase requests.'}
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

      {isClient && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Available Extinguishers</h2>
          {catalogLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-red-600 rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {catalog.map((item: CatalogItem) => (
                <div key={item.type} className="bg-white border rounded-xl p-5">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold">{item.type}</h3>
                      <p className="text-sm text-gray-500">{item.manufacturer} · {item.capacity}</p>
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                      <p className="text-sm font-medium text-red-700 mt-2">
                        RWF {item.unitPrice.toLocaleString()} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(item.type, -1)}
                        className="w-8 h-8 rounded-lg border text-lg leading-none"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium">{cart[item.type] || 0}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.type, 1)}
                        className="w-8 h-8 rounded-lg border text-lg leading-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cartTotal > 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMut.mutate();
              }}
              className="mt-6 bg-white border rounded-xl p-6"
            >
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <p className="text-sm text-gray-600 mb-4">
                {cartTotal} unit(s) · estimated RWF {cartValue.toLocaleString()}
              </p>
              <label className="block mb-4">
                <span className="text-sm font-medium text-gray-700">Delivery / site notes (optional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Building address, preferred delivery date, etc."
                />
              </label>
              <button
                type="submit"
                disabled={createMut.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {createMut.isPending ? 'Submitting...' : 'Submit Order for Approval'}
              </button>
            </form>
          )}
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">{isClient ? 'My Orders' : 'All Orders'}</h2>
        {ordersLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-b-2 border-red-600 rounded-full" />
          </div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Order #', 'Date', 'Items', 'Qty', 'Status', isAdmin ? 'Actions' : 'Notes']
                    .filter(Boolean)
                    .map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs uppercase text-gray-500">
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order: PurchaseOrder) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {order.items.map((i) => `${i.quantity}× ${i.extinguisherType}`).join(', ')}
                    </td>
                    <td className="px-4 py-3">{order.totalQuantity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[order.status]}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    {isAdmin ? (
                      <td className="px-4 py-3">
                        {order.status === 'PENDING' ? (
                          <div className="flex gap-2">
                            <button onClick={() => setApproveId(order.id)} className="text-green-600">
                              Approve
                            </button>
                            <button onClick={() => setRejectId(order.id)} className="text-red-600">
                              Reject
                            </button>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    ) : (
                      <td className="px-4 py-3 text-gray-600">
                        {order.rejectionReason || order.notes || '—'}
                      </td>
                    )}
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={approveId !== null}
        title="Approve Order"
        message="Approve this order? Extinguishers will be registered and assigned to the client."
        onConfirm={() => approveId && approveMut.mutate(approveId)}
        onCancel={() => setApproveId(null)}
      />

      {rejectId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold mb-3">Reject Order</h3>
            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700">Rejection reason *</span>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                rows={3}
                required
              />
            </label>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRejectId(null)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">
                Cancel
              </button>
              <button
                onClick={() =>
                  rejectId &&
                  rejectReason.trim().length >= 3 &&
                  rejectMut.mutate({ id: rejectId, rejectionReason: rejectReason.trim() })
                }
                disabled={rejectReason.trim().length < 3 || rejectMut.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                Reject Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
