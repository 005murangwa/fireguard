import { useState } from 'react';
import { reportApi } from '../services/api.service';
import { getApiErrorMessage } from '../lib/errors';

const reports = [
  { type: 'expired', label: 'Expired Extinguishers', icon: '❌' },
  { type: 'upcoming-expirations', label: 'Upcoming Expirations', icon: '⏳' },
  { type: 'inspections', label: 'Inspection Reports', icon: '🔍' },
  { type: 'maintenance', label: 'Maintenance Reports', icon: '🔧' },
  { type: 'statistics', label: 'System Statistics', icon: '📊' },
];

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const download = async (type: string, label: string) => {
    setLoading(type);
    setError('');
    try {
      const res = await reportApi.download(type);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fireguard-${type}-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiErrorMessage(err, `Failed to download ${label}`));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">PDF Reports</h1>
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((r) => (
          <div key={r.type} className="bg-white border rounded-xl p-6 flex flex-col">
            <span className="text-3xl mb-3">{r.icon}</span>
            <h2 className="font-semibold mb-4">{r.label}</h2>
            <button
              onClick={() => download(r.type, r.label)}
              disabled={loading === r.type}
              className="mt-auto bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {loading === r.type ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
