import { useEffect, useState } from 'react';
import {
  average,
  collection,
  count,
  getAggregateFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/useAuth';
import { type Review } from '../types/review';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import { BORDER, BRAND, CARD, DANGER, DIVIDE, MUTED, SUBTLE } from '../lib/theme';

const REVIEWS_PAGE_SIZE = 10;

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' });

interface ProductReviewsProps {
  sku: string;
}

interface Summary {
  total: number;
  average: number;
}

interface Access {
  canReview: boolean;
  alreadyReviewed: boolean;
}

/**
 * A média do produto, calculada no servidor.
 *
 * `average('rating')` em vez de somar os itens carregados: com o limite de
 * página, somar aqui daria a média das 10 primeiras avaliações, não a do produto.
 *
 * Exige o índice composto `reviews (sku ASC, rating ASC)` — e isso é fácil de
 * errar. `count()` com filtro de igualdade é resolvido pelo índice automático,
 * mas `average`/`sum` precisam do CAMPO AGREGADO no índice junto do campo
 * filtrado. Sem ele vem `failed-precondition`, não resultado vazio.
 *
 * Devolve `null` em vez de propagar o erro: a média é acessório da seção, e
 * derrubar a lista inteira por causa dela é pior do que exibir a lista sem o
 * resumo no topo.
 */
async function loadSummary(sku: string): Promise<Summary | null> {
  try {
    const snapshot = await getAggregateFromServer(
      query(collection(db, 'reviews'), where('sku', '==', sku)),
      { total: count(), average: average('rating') }
    );

    const total = snapshot.data().total;
    const averageRating = snapshot.data().average;

    // `average()` devolve null quando não há documento que case o filtro.
    let safeAverage = 0;
    if (typeof averageRating === 'number') {
      safeAverage = averageRating;
    }

    return { total, average: safeAverage };
  } catch (error) {
    console.error('Não foi possível calcular a média das avaliações:', error);
    return null;
  }
}

/**
 * Lista e média.
 *
 * `getDocs` e não `onSnapshot`: avaliação não muda enquanto a pessoa lê a
 * página. O tempo real do projeto é para carrinho, pedidos e rastreamento, onde
 * o estado muda sozinho.
 *
 * A listagem usa o índice `reviews (sku ASC, createdAt DESC)`; a média usa outro,
 * e só a falha da LISTAGEM é propagada.
 */
async function loadReviews(
  sku: string
): Promise<{ reviews: Review[]; summary: Summary | null }> {
  const listSnap = await getDocs(
    query(
      collection(db, 'reviews'),
      where('sku', '==', sku),
      orderBy('createdAt', 'desc'),
      limit(REVIEWS_PAGE_SIZE)
    )
  );

  const reviews = listSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Review[];

  return { reviews, summary: await loadSummary(sku) };
}

/**
 * Pode avaliar? Dica de interface, não autorização.
 *
 * O cliente consegue ler os próprios pedidos, então decide localmente se mostra
 * o formulário — e `api/reviews.ts` reconfere com autoridade pelo Admin SDK. É a
 * mesma divisão que o projeto já faz com admin: `AuthContext.isAdmin` controla a
 * interface, e `api/admin/orders/tracking.ts` relê `admins/{uid}` antes de gravar.
 *
 * As duas consultas são só de igualdade — nenhum índice composto necessário.
 */
async function loadAccess(uid: string, sku: string): Promise<Access> {
  const existing = await getDocs(
    query(
      collection(db, 'reviews'),
      where('sku', '==', sku),
      where('userId', '==', uid),
      limit(1)
    )
  );

  if (!existing.empty) {
    return { canReview: false, alreadyReviewed: true };
  }

  const ordersSnap = await getDocs(
    query(
      collection(db, 'orders'),
      where('uid', '==', uid),
      where('status', '==', 'paid'),
      where('fulfillment.status', '==', 'delivered')
    )
  );

  for (const doc of ordersSnap.docs) {
    const items = doc.data().items;
    if (!Array.isArray(items)) continue;

    for (const item of items as { sku?: unknown }[]) {
      if (item && item.sku === sku) return { canReview: true, alreadyReviewed: false };
    }
  }

  return { canReview: false, alreadyReviewed: false };
}

const NO_ACCESS: Access = { canReview: false, alreadyReviewed: false };

/** Resultado carregado, marcado com o que o originou. */
interface LoadedReviews {
  sku: string;
  reviews: Review[];
  /** `null` quando a agregação falhou — a lista continua válida. */
  summary: Summary | null;
  error: string | null;
}

interface LoadedAccess {
  uid: string;
  sku: string;
  value: Access;
}

export default function ProductReviews({ sku }: ProductReviewsProps) {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState<LoadedReviews | null>(null);
  const [loadedAccess, setLoadedAccess] = useState<LoadedAccess | null>(null);

  // Contador de recarga. Enviar uma avaliação precisa reler a lista, e esta é a
  // forma de pedir isso sem chamar uma função assíncrona com setState dentro do
  // corpo do efeito — o que dispara `set-state-in-effect`.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    loadReviews(sku)
      .then((next) => {
        if (active) {
          setLoaded({ sku, reviews: next.reviews, summary: next.summary, error: null });
        }
      })
      .catch((loadError) => {
        console.error('Não foi possível carregar as avaliações:', loadError);
        if (active) {
          setLoaded({
            sku,
            reviews: [],
            summary: null,
            error: 'Não foi possível carregar as avaliações.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [sku, reloadToken]);

  const uid = user?.uid ?? null;

  useEffect(() => {
    // Deslogado não tem o que carregar: o estado derivado abaixo já devolve
    // NO_ACCESS sem precisar de setState no corpo do efeito.
    if (uid === null) return;

    // A flag evita gravar o resultado de um SKU antigo depois de trocar de produto.
    let active = true;

    loadAccess(uid, sku)
      .then((next) => {
        if (active) setLoadedAccess({ uid, sku, value: next });
      })
      .catch((accessError) => {
        console.error('Não foi possível verificar se você pode avaliar:', accessError);
        if (active) setLoadedAccess({ uid, sku, value: NO_ACCESS });
      });

    return () => {
      active = false;
    };
  }, [uid, sku]);

  // Estado DERIVADO de o resultado em mão corresponder ao produto (e à pessoa)
  // de agora. Navegar entre produtos troca o `sku` sem remontar o componente, e
  // isto volta a "carregando" sozinho — sem o `setLoading(true)` dentro do
  // efeito que a regra `set-state-in-effect` proíbe.
  const current = loaded !== null && loaded.sku === sku ? loaded : null;
  const loading = current === null;
  const reviews = current === null ? [] : current.reviews;
  const summary = current === null ? null : current.summary;
  const error = current === null ? null : current.error;

  const accessMatches =
    loadedAccess !== null && loadedAccess.uid === uid && loadedAccess.sku === sku;
  const access = accessMatches && loadedAccess !== null ? loadedAccess.value : NO_ACCESS;

  const handleCreated = () => {
    if (uid !== null) {
      setLoadedAccess({ uid, sku, value: { canReview: false, alreadyReviewed: true } });
    }
    setReloadToken((token) => token + 1);
  };

  return (
    <section className="mt-12" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className={`text-4xl font-bold ${BRAND}`}>
        Avaliações
      </h2>

      {summary !== null && summary.total > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <StarRating rating={summary.average} reviewCount={summary.total} />
          <p className={`text-sm ${MUTED}`}>
            Média de {summary.average.toFixed(1)} em {summary.total}{' '}
            {summary.total === 1 ? 'avaliação' : 'avaliações'}
          </p>
        </div>
      )}

      {access.canReview && (
        <div className="mt-8">
          <ReviewForm sku={sku} onCreated={handleCreated} />
        </div>
      )}

      {access.alreadyReviewed && (
        <p className={`mt-6 text-sm ${MUTED}`}>Você já avaliou este produto.</p>
      )}

      {loading && <p className={`mt-8 text-sm ${MUTED}`}>Carregando avaliações...</p>}

      {!loading && error !== null && <p className={`mt-8 text-sm ${DANGER}`}>{error}</p>}

      {!loading && error === null && reviews.length === 0 && (
        <p className={`mt-8 text-sm ${MUTED}`}>
          Este produto ainda não tem avaliações. Quem compra e recebe pode avaliar.
        </p>
      )}

      {reviews.length > 0 && (
        <ul
          className={`mt-8 divide-y ${DIVIDE} rounded-lg border ${BORDER} ${CARD}`}
          role="list"
        >
          {reviews.map((review) => (
            <li key={review.id} className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className={`text-sm font-semibold ${BRAND}`}>{review.userName}</p>

                {review.createdAt && (
                  <time
                    dateTime={review.createdAt.toDate().toISOString()}
                    className={`text-xs ${SUBTLE}`}
                  >
                    {dateFormatter.format(review.createdAt.toDate())}
                  </time>
                )}
              </div>

              <div className="mt-2">
                <StarRating rating={review.rating} />
              </div>

              {review.title && (
                <p className={`mt-3 text-base font-semibold ${BRAND}`}>{review.title}</p>
              )}

              <p className={`mt-2 text-sm ${MUTED}`}>{review.comment}</p>
            </li>
          ))}
        </ul>
      )}

      {summary !== null && summary.total > reviews.length && (
        <p className={`mt-6 text-center text-sm ${SUBTLE}`}>
          Mostrando as {reviews.length} avaliações mais recentes de {summary.total}.
        </p>
      )}
    </section>
  );
}
