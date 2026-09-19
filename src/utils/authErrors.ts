// Mapeia os códigos do Firebase Auth para mensagens em português.
//
// Isto vive fora dos componentes de propósito: o babel-plugin-react-compiler
// desiste de memoizar um componente inteiro ao encontrar condicional, `??` ou
// `?.` dentro de um try/catch. Mantendo a lógica aqui, os formulários só
// precisam chamar `authErrorMessage(error)` de dentro do catch — uma chamada de
// função simples, que o compiler aceita.

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
  'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',

  // As três abaixo caem na mesma mensagem genérica de propósito: distinguir
  // "e-mail não existe" de "senha errada" entrega a terceiros quais e-mails
  // têm conta na loja.
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
};

const FALLBACK_MESSAGE = 'Não foi possível concluir. Tente novamente.';

export function authErrorMessage(error: unknown): string {
  let code = '';

  if (typeof error === 'object' && error !== null && 'code' in error) {
    code = String((error as { code: unknown }).code);
  }

  const message = AUTH_ERROR_MESSAGES[code];
  if (message) return message;

  return FALLBACK_MESSAGE;
}
