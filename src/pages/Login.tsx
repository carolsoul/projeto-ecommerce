import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { authErrorMessage } from '../utils/authErrors';

interface LoginRedirectState {
  from?: string;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Quem chegou aqui por tentar favoritar ou comprar volta para onde estava.
  const state = location.state as LoginRedirectState | null;
  const redirectTo = state?.from ?? '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    let failure: unknown = null;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      failure = err;
    }

    setSubmitting(false);

    if (failure) {
      setError(authErrorMessage(failure));
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  return (
    <main className="max-w-sm mx-auto mt-16 mb-20 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Entrar</h1>
      <p className="text-sm text-slate-600 mb-6">Bem-vinda de volta.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-900" htmlFor="login-email">
          E-mail
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          required
        />

        <label className="text-sm font-medium text-slate-900" htmlFor="login-password">
          Senha
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          required
        />

        {error && (
          <p role="alert" className="text-red-600 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md py-2.5 font-semibold cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-sm text-slate-600 mt-6 text-center">
        Ainda não tem conta?{' '}
        <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
          Cadastre-se
        </Link>
      </p>
    </main>
  );
}
