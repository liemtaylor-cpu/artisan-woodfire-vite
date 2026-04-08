import { useState } from 'react';
import { api } from '../utils/api';
import Icon from '../components/Icon';

const LoginPage = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.authStaff(password);
      localStorage.setItem('artisan_role', result.role);
      onLogin(result.role);
    } catch {
      setError('Invalid password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 bg-orange-500 rounded-2xl">
            <Icon name="fire" className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">Artisan</p>
            <p className="text-stone-400 text-sm">Woodfire Kitchen</p>
          </div>
        </div>
        <form onSubmit={submit} className="bg-white rounded-2xl p-6 shadow-2xl space-y-4">
          <h2 className="text-stone-800 font-bold text-lg">Sign In</h2>
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
          <button type="submit" disabled={loading || !password}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
