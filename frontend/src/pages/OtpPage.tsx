import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/errors';

export default function OtpPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyOtp(email, otpCode);
      setSession(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid or expired OTP'));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await authApi.resendOtp(email);
      setMessage('New OTP sent to your email.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to resend OTP'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">Verify Email</h1>
        <p className="text-gray-500 text-center text-sm mb-6">Enter the 6-digit code sent to {email || 'your email'}</p>
        <form onSubmit={verify} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {message && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">{message}</div>}
          <input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} maxLength={6}
            className="w-full px-4 py-2.5 border rounded-lg text-center text-2xl tracking-widest" placeholder="000000" required />
          <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50">Verify</button>
        </form>
        <button onClick={resend} className="w-full mt-3 text-sm text-red-600 hover:underline">Resend OTP</button>
      </div>
    </div>
  );
}
