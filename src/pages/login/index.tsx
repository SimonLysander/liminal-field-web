import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/auth';
import { parseError } from '@/pages/admin/helpers';

export default function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.login(password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(parseError(err, '登录失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'var(--paper)' }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex w-80 flex-col gap-4"
      >
        <div className="flex justify-center">
          <div
            className="flex h-10 w-10 items-center justify-center text-sm font-semibold"
            style={{
              background: 'var(--ink)',
              color: 'var(--paper)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            L
          </div>
        </div>

        <h1
          className="text-center text-lg font-medium"
          style={{ color: 'var(--ink)' }}
        >
          Liminal Field
        </h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="管理密码"
          autoFocus
          className="h-10 rounded-lg px-3 text-sm outline-none transition-shadow focus:ring-2"
          style={{
            background: 'var(--shelf)',
            color: 'var(--ink)',
            border: '0.5px solid var(--separator)',
          }}
        />

        {error && (
          <p className="text-xs" style={{ color: 'var(--mark-red)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="h-10 text-sm font-medium transition-opacity disabled:opacity-50"
          style={{
            background: 'var(--ink)',
            color: 'var(--paper)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  );
}
