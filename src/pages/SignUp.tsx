import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { authErrorMessage } from '../utils/authErrors';
import { BORDER, BRAND, BRAND_BG, BRAND_BG_HOVER, BRAND_HOVER, DANGER, DISABLED_PINK, FOCUS, MUTED } from '../lib/theme';

const MIN_PASSWORD_LENGTH = 6;

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validações locais antes de gastar uma chamada de rede.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setError('');
    setSubmitting(true);

    let failure: unknown = null;

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const trimmedName = name.trim();

      await updateProfile(credential.user, { displayName: trimmedName });

      // Carrinho e a wishlist já vivem em subcoleções de users/{uid}, então o documento pai passa a existir de fato.
      await setDoc(doc(db, 'users', credential.user.uid), {
        name: trimmedName,
        email: credential.user.email,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      failure = err;
    }

    setSubmitting(false);

    if (failure) {
      setError(authErrorMessage(failure));
      return;
    }

    navigate('/');
  };

  return (
    <main className="max-w-sm mx-auto mt-16 mb-20 px-4">
      <h1 className={`text-2xl font-bold ${BRAND} mb-1`}>Criar conta</h1>
      <p className={`text-sm ${MUTED} mb-6`}>
        É rápido — só precisamos do seu nome, e-mail e uma senha.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className={`text-sm font-medium ${BRAND}`} htmlFor="signup-name">
          Nome
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`border ${BORDER} rounded-md px-3 py-2 ${FOCUS}`}
          required
        />

        <label className={`text-sm font-medium ${BRAND}`} htmlFor="signup-email">
          E-mail
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`border ${BORDER} rounded-md px-3 py-2 ${FOCUS}`}
          required
        />

        <label className={`text-sm font-medium ${BRAND}`} htmlFor="signup-password">
          Senha
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`border ${BORDER} rounded-md px-3 py-2 ${FOCUS}`}
          required
        />

        <label className={`text-sm font-medium ${BRAND}`} htmlFor="signup-confirm">
          Confirmar senha
        </label>
        <input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          {submitting ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className={`text-sm ${MUTED} mt-6 text-center`}>
        Já tem conta?{' '}
        <Link to="/login" className={`${BRAND} ${BRAND_HOVER} font-medium`}>
          Entrar
        </Link>
      </p>
    </main>
  );
}
