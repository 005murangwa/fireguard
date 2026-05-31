import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api.service';
import { getApiErrorMessage } from '../lib/errors';

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.signup({ ...form, email: form.email.trim().toLowerCase(), role: 'CLIENT' });
      navigate('/verify-otp', { state: { email: form.email.trim().toLowerCase() } });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {(['firstName', 'lastName', 'email', 'phoneNumber', 'password'] as const).map((f) => (
            <input key={f} type={f === 'password' ? 'password' : f === 'email' ? 'email' : 'text'}
              placeholder={f.replace(/([A-Z])/g, ' $1')} value={form[f]}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-lg" required minLength={f === 'password' ? 8 : 2} />
          ))}
          <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50">
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center text-sm mt-4"><Link to="/login" className="text-red-600">Already have an account?</Link></p>
      </div>
    </div>
  );
}
