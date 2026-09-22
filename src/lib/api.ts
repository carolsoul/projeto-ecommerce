import { auth } from './firebase';

/**
 * Chamadas autenticadas à API do checkout.
 *
 * Manda o ID token do Firebase no header Authorization. O servidor verifica a
 * assinatura e descobre quem é — por isso o corpo da requisição nunca precisa
 * (nem pode) informar o uid.
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const user = auth.currentUser;

  if (user === null) {
    throw new ApiError('Você precisa estar logado.', 401);
  }

  const token = await user.getIdToken();

  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload !== null && typeof payload.error === 'string'
        ? payload.error
        : 'Não foi possível concluir a operação.';

    throw new ApiError(message, response.status);
  }

  return payload as T;
}
