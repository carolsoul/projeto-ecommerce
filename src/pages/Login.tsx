import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { authErrorMessage } from '../utils/authErrors';
import { BORDER, BRAND, BRAND_BG, BRAND_BG_HOVER, BRAND_HOVER, DANGER, DISABLED_PINK, FOCUS, MUTED } from '../lib/theme';

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
      <h1 className={`text-2xl font-bold ${BRAND} mb-1`}>Entrar</h1>
      <p className={`text-sm ${MUTED} mb-6`}>Bem-vinda de volta.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className={`text-sm font-medium ${BRAND}`} htmlFor="login-email">
          E-mail
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`border ${BORDER} rounded-md px-3 py-2 ${FOCUS}`}
          required
        />

        <label className={`text-sm font-medium ${BRAND}`} htmlFor="login-password">
          Senha
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`border ${BORDER} rounded-md px-3 py-2 ${FOCUS}`}
          required
        />

        {error && (
          <p role="alert" className={`${DANGER} text-sm`}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`mt-2 ${BRAND_BG} ${BRAND_BG_HOVER} ${DISABLED_PINK} disabled:cursor-not-allowed text-white rounded-md py-2.5 font-semibold cursor-pointer transition-colors ${FOCUS}`}
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className={`text-sm ${MUTED} mt-6 text-center`}>
        Ainda não tem conta?{' '}
        <Link to="/signup" className={`${BRAND} ${BRAND_HOVER} font-medium`}>
          Cadastre-se
        </Link>
      </p>
    </main>
  );
}
