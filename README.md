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
| Build | Vite 8, TypeScript 6, React Compiler (babel-plugin-react-compiler) |
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
| `/admin/login` | Login do administrador | Público |
| `/admin/products/upload` | Importação de produtos via CSV | **Admin** |

As rotas administrativas passam por `ProtectedRoute`, que redireciona para `/admin/login` quando não há usuário autenticado **ou** quando o usuário não é admin.

---

## Modelo de dados (Firestore)

| Coleção | Documento | Conteúdo |
| --- | --- | --- |
| `products` | `{sku}` | Catálogo. O ID do documento é o SKU normalizado (minúsculo, sem espaços) |
| `admins` | `{uid}` | Lista de administradores — **a simples existência do documento concede acesso admin** |
| `users/{uid}/cart` | `{sku}` | Carrinho do usuário. O ID do documento é o SKU do produto |

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
│                    # CartContext (carrinho). Os hooks e os objetos de contexto
│                    # ficam em useAuth.ts / useCart.ts, separados para não
│                    # quebrar o Fast Refresh dos providers
├── layouts/         # StoreLayout, CheckoutLayout, FooterLayout
├── lib/             # firebase.ts — inicialização do SDK
├── pages/
│   ├── admin/       # Login, ProductUpload
│   ├── Home.tsx
│   ├── ProductPage.tsx
│   └── Cart.tsx
├── schemas/         # productSchema.ts — validação Zod do CSV
├── types/           # Product, CartItem
├── utils/           # pricing.ts — cálculo de desconto
├── App.tsx          # Providers + tabela de rotas
├── main.tsx         # Entry point
└── index.css        # @import "tailwindcss"
```

Os providers são montados em `App.tsx` na ordem `AuthProvider → CartProvider`: o carrinho depende do usuário autenticado, e limpa seu estado no logout.

---

## Em desenvolvimento

Funcionalidades já previstas no código (rotas/arquivos comentados ou placeholders) mas ainda não implementadas:

- **Checkout e pagamento** — `CheckoutLayout` existe, as rotas estão comentadas em `App.tsx`
- **Cadastro e login de clientes** — hoje só há login de admin; o Header já linka para `/signup` e `/perfil`
- **Lista de desejos** (`/whishlist`) e **pedidos** (`/orders`)
- **Busca** — o campo no Header mantém estado local, mas ainda não filtra
- **Filtro de categorias** — `CategoryFilter.tsx` está vazio e `ProductCategory` usa imagens fixas
- **Dashboard admin** (`AdminDashboard`)
- Frete e taxa no carrinho são **valores fixos** (`SHIPPING` e `TAX` em `src/pages/Cart.tsx`)
