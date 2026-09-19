# projeto-ecommerce

Loja virtual (SPA) construída com **React 19 + TypeScript + Vite**, estilizada com **Tailwind CSS v4** e com backend serverless no **Firebase** (Firestore + Authentication).

O projeto tem duas áreas:

- **Loja** — vitrine de produtos, página de detalhe e carrinho persistido por usuário.
- **Admin** — área protegida por login com importação de catálogo em massa via CSV.

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| UI | React 19, React Router 7, Tailwind CSS 4, lucide-react (ícones) |
| Build | Vite 8 (rolldown), TypeScript 6, React Compiler via `@rolldown/plugin-babel` |
| Backend | Firebase 12 — Cloud Firestore + Authentication |
| Validação | Zod 4 |
| CSV | PapaParse 5 |
| Qualidade | ESLint 10 + typescript-eslint |

---

## Pré-requisitos

- **Node.js 20+** e npm
- Um projeto Firebase com **Firestore** e **Authentication (Email/Senha)** habilitados

---

## Instalação

```bash
git clone https://github.com/carolsoul/projeto-ecommerce.git
cd projeto-ecommerce
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto (ele está no `.gitignore` e **não deve ser commitado**) com as credenciais do seu app web do Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Essas variáveis são lidas em `src/lib/firebase.ts`. Como o Vite expõe tudo que começa com `VITE_` no bundle do cliente, a proteção real do banco depende das **Security Rules do Firestore** — não do sigilo dessas chaves.

### Rodando

```bash
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

---

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Checagem de tipos (`tsc -b`) + build de produção |
| `npm run preview` | Serve localmente o build de produção |
| `npm run lint` | Roda o ESLint em todo o projeto |

---

## Rotas

| Rota | Página | Acesso |
| --- | --- | --- |
| `/` | Home — banner, categorias e grade de produtos | Público |
| `/produto/:sku` | Detalhe do produto | Público |
| `/cart` | Carrinho | Público (itens exigem login) |
| `/wishlist` | Favoritos | Público (o conteúdo exige login) |
| `/login` | Login do cliente | Público |
| `/signup` | Cadastro do cliente | Público |
| `/admin/login` | Login do administrador | Público |
| `/admin/products/upload` | Importação de produtos via CSV | **Admin** |

As rotas administrativas passam por `ProtectedRoute`, que redireciona para `/admin/login` quando não há usuário autenticado **ou** quando o usuário não é admin.

Cliente e administrador usam o **mesmo provedor** de e-mail/senha do Firebase Auth — o que distingue os dois é a existência de um documento em `admins/{uid}`. As duas telas de login são separadas só porque o destino após entrar é diferente.

Quem tenta favoritar ou adicionar ao carrinho sem estar logado é levado para `/login` com a origem em `location.state.from`, e volta para o produto depois de entrar.

---

## Modelo de dados (Firestore)

| Coleção | Documento | Conteúdo |
| --- | --- | --- |
| `products` | `{sku}` | Catálogo. O ID do documento é o SKU normalizado (minúsculo, sem espaços) |
| `admins` | `{uid}` | Lista de administradores — **a simples existência do documento concede acesso admin** |
| `users` | `{uid}` | Perfil do cliente (`name`, `email`, `createdAt`), criado no cadastro |
| `users/{uid}/cart` | `{sku}` | Carrinho do usuário. O ID do documento é o SKU do produto |
| `users/{uid}/wishlist` | `{sku}` | Favoritos do usuário. O ID do documento é o SKU do produto |

### Produto

```ts
interface Product {
  id: string;            // = SKU
  name: string;
  imageUrl: string;
  price: number;
  mrp?: number | null;   // preço "de" — usado para calcular o % de desconto
  rating: number;        // 0 a 5
  reviewCount: number;
  category?: string | null;
  stock?: number | null;
  createdAt?: Timestamp; // gravado via serverTimestamp() na importação
}
```

> A listagem da Home ordena por `createdAt desc`. Produtos criados fora do fluxo de importação precisam desse campo para aparecer.

### Item de carrinho

```ts
interface CartItem {
  sku: string;
  quantity: number;
  price: number;    // preço no momento em que o item foi adicionado
  name: string;
  imageUrl: string;
}
```

O carrinho é sincronizado em tempo real via `onSnapshot`, então ele acompanha o usuário entre abas e dispositivos.

### Configurando o primeiro admin

1. Crie um usuário em **Authentication → Users** no console do Firebase.
2. Crie manualmente um documento em `admins` cujo **ID seja o UID** desse usuário (o conteúdo pode ficar vazio).
3. Acesse `/admin/login`.

### Security Rules

As regras **não estão versionadas neste repositório** — elas vivem no console do Firebase. Como as chaves do `.env.local` vão para o bundle do cliente, são elas que realmente protegem o banco. O mínimo que o código atual exige:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Catálogo: qualquer um lê, só admin escreve.
    match /products/{sku} {
      allow read: if true;
      allow write: if exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Cada pessoa só enxerga e altera os próprios dados.
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /{sub=**} {   // cart e wishlist
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }

    // A lista de admins é lida pelo app para decidir o acesso, mas nunca escrita por ele.
    match /admins/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;
    }
  }
}
```

> Se o cadastro ou os favoritos falharem com `Missing or insufficient permissions`, é aqui que está o problema — e não no código.

---

## Importação de produtos via CSV

Em `/admin/products/upload` o arquivo é lido com PapaParse (`header: true`, tipagem dinâmica), validado linha a linha com Zod e só então gravado no Firestore em **lotes de 500** (`writeBatch`) com `merge: true` — ou seja, reimportar o mesmo SKU **atualiza** o produto em vez de duplicá-lo.

A tela mostra uma prévia com as linhas válidas em verde e as inválidas em vermelho, com o motivo de cada erro, antes de qualquer gravação.

### Colunas

| Coluna | Obrigatória | Regra |
| --- | --- | --- |
| `sku` | Sim | Texto não vazio; vira o ID do documento (minúsculo, espaços → `-`) |
| `name` | Sim | Texto não vazio |
| `imageUrl` | Sim | URL válida |
| `price` | Sim | Número maior que zero |
| `mrp` | Não | Número maior que zero e **≥ `price`** |
| `rating` | Sim | Número entre 0 e 5 |
| `reviewCount` | Sim | Inteiro não negativo |
| `category` | Não | Texto |
| `stock` | Não | Inteiro não negativo |

### Exemplo

```csv
sku,name,imageUrl,price,mrp,rating,reviewCount,category,stock
CAM-001,Camiseta Básica,https://exemplo.com/camiseta.jpg,49.90,79.90,4.5,120,roupas,35
TEN-014,Tênis Runner,https://exemplo.com/tenis.jpg,199.90,249.90,4.8,87,calcados,12
```

O desconto exibido nos cards é derivado de `price` e `mrp` (`src/utils/pricing.ts`) — não existe campo de desconto no CSV.

---

## Estrutura do projeto

```
src/
├── components/      # Banner, Header, ProductCard, ProductList, ProductView,
│                    # ProductCategory, StarRating, ProtectedRoute
├── context/         # Providers: AuthContext (sessão + flag de admin),
│                    # CartContext (carrinho), WishlistContext (favoritos).
│                    # Os hooks e os objetos de contexto ficam em useAuth.ts /
│                    # useCart.ts / useWishlist.ts, separados para não quebrar
│                    # o Fast Refresh dos providers
├── layouts/         # StoreLayout, CheckoutLayout, FooterLayout
├── lib/             # firebase.ts — inicialização do SDK
├── pages/
│   ├── admin/       # Login, ProductUpload
│   ├── Home.tsx
│   ├── ProductPage.tsx
│   ├── Cart.tsx
│   ├── Wishlist.tsx
│   ├── Login.tsx    # login do cliente (o do admin fica em admin/)
│   └── SignUp.tsx
├── schemas/         # productSchema.ts — validação Zod do CSV
├── types/           # Product, CartItem, WishlistItem
├── utils/           # pricing.ts — desconto; authErrors.ts — mensagens do Auth
├── App.tsx          # Providers + tabela de rotas
├── main.tsx         # Entry point
└── index.css        # @import "tailwindcss"
```

Os providers são montados em `App.tsx` na ordem `AuthProvider → CartProvider`: o carrinho depende do usuário autenticado, e limpa seu estado no logout.

---

## Performance

Algumas decisões do build e do código não são óbvias à primeira leitura:

**Chunks.** As rotas de admin são carregadas com `React.lazy`, porque elas puxam Zod e PapaParse — peso morto para quem só quer comprar. Firebase e o core do React ficam em chunks próprios (`codeSplitting.groups` no `vite.config.ts`) para seguirem em cache do navegador entre deploys. O build ainda avisa que um chunk passa de 500 kB: é o do Firebase, que é o piso desta arquitetura, já que Firestore e Auth são inicializados logo na primeira tela. O aviso é informativo — não vale silenciá-lo com `chunkSizeWarningLimit`.

**Paginação.** `ProductList` busca 24 produtos por vez e pagina com `startAfter`. O cursor é o `QueryDocumentSnapshot` do último item, **não** o valor de `createdAt`: a importação em lote grava `serverTimestamp()` em centenas de produtos quase no mesmo instante, e só o snapshot desempata (pelo `__name__` implícito) sem pular nem repetir itens.

**React Compiler.** Está ativo, então não há `useMemo`/`useCallback`/`React.memo` escritos à mão — nem devem ser adicionados. Em compensação, o compiler da versão 1.0.0 **desiste de memoizar o componente inteiro** ao encontrar `try/finally`, ou `??`/`?.`/ternário dentro de um `try/catch`. É por isso que os blocos de `ProductList` têm o formato repetitivo que têm. Para checar se algum componente parou de compilar, rode o Babel com o `logger` do `babel-plugin-react-compiler` e procure por `CompileError`.

**Imagens.** Cards, categorias e itens do carrinho usam `loading="lazy"`; o hero do Banner e a imagem da página de produto usam `fetchPriority="high"`, porque são o elemento LCP das suas telas. Todas têm `width`/`height` explícitos para não causar layout shift.

---

## Em desenvolvimento

Funcionalidades já previstas no código (rotas/arquivos comentados ou placeholders) mas ainda não implementadas:

- **Checkout e pagamento** — `CheckoutLayout` existe, as rotas estão comentadas em `App.tsx`
- **Login por celular** — o Firebase não tem provedor de telefone + senha: ou é SMS com código (passwordless, exige reCAPTCHA e custa por mensagem), ou se deriva um e-mail sintético do número. Decisão adiada
- **Página de perfil** (`/perfil`) — o cadastro já grava `name` e `email` em `users/{uid}`, mas não há tela para editar
- **Recuperação de senha** — falta `sendPasswordResetEmail`
- **Pedidos** (`/orders`)
- **Busca** — o campo no Header mantém estado local, mas ainda não filtra
- **Filtro de categorias** — `CategoryFilter.tsx` está vazio e `ProductCategory` usa imagens fixas
- **Dashboard admin** (`AdminDashboard`)
- Frete e taxa no carrinho são **valores fixos** (`SHIPPING` e `TAX` em `src/pages/Cart.tsx`)
