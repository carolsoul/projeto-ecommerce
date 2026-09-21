import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AuthContext } from './useAuth';

/**
 * Verifica se o usuário é admin pela existência de `admins/{uid}`.
 *
 * O try/catch não é decorativo: as regras do Firestore podem negar essa leitura,
 * e "negado" é uma resposta válida aqui — significa apenas que a pessoa não é
 * admin. Sem ele, a promise rejeitada interrompia o callback antes do
 * `setLoading(false)`, e a aplicação inteira ficava presa em "Carregando..."
 * para sempre: rotas protegidas e a página de favoritos nunca renderizavam.
 *
 * Vive fora do componente porque o React Compiler desiste de memoizar um
 * componente que tenha condicional dentro de try/catch.
 */
async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    return adminDoc.exists();
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      let admin = false;
      if (firebaseUser) {
        admin = await checkIsAdmin(firebaseUser.uid);
      }

      setIsAdmin(admin);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
