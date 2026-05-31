import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../services/api.service';
import ConfirmDialog from '../components/ConfirmDialog';
import type { User, UserRole } from '../types';
import { getApiErrorMessage } from '../lib/errors';

export default function UsersPage() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll().then((r) => r.data as User[]),
  });

  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) => userApi.assignRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    onError: (e) => setError(getApiErrorMessage(e, 'Failed to update role')),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
    },
    onError: (e) => setError(getApiErrorMessage(e, 'Failed to delete user')),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-b-2 border-red-600 rounded-full" />
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Phone', 'Role', 'Verified', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.phoneNumber}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => roleMut.mutate({ id: u.id, role: e.target.value as UserRole })}
                      className="border rounded px-2 py-1 text-xs"
                    >
                      {(['ADMIN', 'INSPECTOR', 'CLIENT'] as UserRole[]).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">{u.isVerified ? '✅' : '❌'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDeleteId(u.id)} className="text-red-600">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete User"
        message="Are you sure you want to perform this action?"
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
