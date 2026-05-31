import { useQuery } from '@tanstack/react-query';
import { userApi } from '../services/api.service';
import type { User } from '../types';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  INSPECTOR: 'Field Inspector',
};

export default function StaffPage() {
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => userApi.getStaff().then((r) => r.data),
  });

  const admins = staff.filter((s: User) => s.role === 'ADMIN');
  const inspectors = staff.filter((s: User) => s.role === 'INSPECTOR');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">FireGuard LTD Staff</h1>
      <p className="text-sm text-gray-500 mb-6">
        Contact our team for inspections, maintenance scheduling, or order support.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-b-2 border-red-600 rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StaffGroup title="Administrators" emoji="👔" members={admins} />
          <StaffGroup title="Inspectors" emoji="🔍" members={inspectors} />
        </div>
      )}
    </div>
  );
}

function StaffGroup({ title, emoji, members }: { title: string; emoji: string; members: User[] }) {
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b bg-gray-50 flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <h2 className="font-semibold">{title}</h2>
        <span className="text-xs text-gray-500 ml-auto">{members.length} member(s)</span>
      </div>
      {members.length === 0 ? (
        <p className="px-5 py-8 text-center text-gray-500 text-sm">No staff listed yet</p>
      ) : (
        <ul className="divide-y">
          {members.map((person) => (
            <li key={person.id} className="px-5 py-4">
              <p className="font-medium">
                {person.firstName} {person.lastName}
              </p>
              <p className="text-sm text-gray-500">{roleLabels[person.role] || person.role}</p>
              <p className="text-sm text-gray-600 mt-1">{person.email}</p>
              <p className="text-sm text-gray-600">{person.phoneNumber}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
