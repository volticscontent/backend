# Estrutura do Frontend - CRM Agency (Next.js App Router)

Este documento descreve a arquitetura do frontend utilizando **Next.js (App Router)** com **Server Components** para atender ao sistema de multi-tenancy (Admin Master vs Cliente).

## 1. Visão Geral
O sistema utilizará **Middleware do Next.js** para reescrever as URLs com base no subdomínio acessado, direcionando para a estrutura de pastas correta sem alterar a URL visível para o usuário.

- **Admin Master**: `admin.dominio.com` -> Renderiza `/app/master`
- **Dash Cliente**: `dash.dominio.com` (ou custom) -> Renderiza `/app/[domain]`

## 2. Estrutura de Diretórios (`/app`)

A estrutura aproveita o **Route Groups** `(...)` para separar layouts e contextos diferentes.

```
/app
├── (auth)                   # Rotas de Autenticação (Compartilhado ou Separado)
│   ├── login/
│   │   └── page.tsx         # Login unificado (detecta contexto via host)
│   └── layout.tsx           # Layout limpo para auth
│
├── (master)                 # Painel Master (Admin) - admin.dominio.com
│   ├── layout.tsx           # Sidebar Master, AdminContext
│   ├── page.tsx             # Dashboard Geral (Stats globais)
│   ├── users/               # Gestão de Clientes/Usuários
│   │   ├── page.tsx         # Lista de Clientes
│   │   └── [id]/page.tsx    # Detalhes/Edição de Cliente
│   └── logs/                # Logs do Sistema
│       └── page.tsx
│
├── (client)                 # Painel do Cliente - dash.dominio.com
│   ├── [domain]/            # Segmento dinâmico injetado pelo Middleware
│   │   ├── layout.tsx       # Sidebar Cliente, ThemeProvider (por cliente)
│   │   ├── page.tsx         # Dashboard do Cliente
│   │   ├── settings/        # Configurações da conta
│   │   └── services/        # Serviços contratados
│   │       └── [service]/   # Detalhes do serviço
│
├── api/                     # Route Handlers (Backend for Frontend se necessário)
├── global.css
└── layout.tsx               # Root Layout
```

## 3. Middleware (`src/middleware.ts`)

Peça chave da arquitetura. Ele intercepta o request, lê o `hostname` e reescreve a rota interna.

```typescript
// Exemplo lógico do middleware
export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host');
  const url = req.nextUrl;
  
  // 1. Identificar se é Admin Master
  if (hostname === 'admin.agency.com') {
    // Reescreve para o grupo (master)
    // url.pathname muda internamente, usuário não vê
    return NextResponse.rewrite(new URL(`/master${url.pathname}`, req.url));
  }

  // 2. Caso contrário, assume que é Cliente (dash.agency.com ou custom domain)
  // Reescreve para o grupo (client) injetando o dominio como parametro
  const customSubDomain = hostname.split('.')[0]; // ex: 'dash' ou 'cliente-x'
  return NextResponse.rewrite(new URL(`/${customSubDomain}${url.pathname}`, req.url));
}
```

## 4. Server Components & Data Fetching

Como estamos usando Next.js, faremos as chamadas ao nosso Backend (Node/Express) diretamente nos Server Components.

### Exemplo: Dashboard do Cliente (`app/(client)/[domain]/page.tsx`)

```tsx
// Server Component - Async
export default async function ClientDashboard({ params }: { params: { domain: string } }) {
  // Chamada direta à API interna (segura, server-to-server)
  const data = await fetch(`http://localhost:3000/api/${params.domain}/dashboard`, {
    cache: 'no-store', // Dados sempre frescos
    headers: { 'x-internal-token': process.env.INTERNAL_TOKEN } // Segurança extra opcional
  }).then(res => res.json());

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Olá, {data.clientName}</h1>
      <StatsGrid stats={data.stats} /> {/* Client Component para interatividade */}
    </div>
  );
}
```

## 5. Componentes de UI (Minímos Iniciais)

Usaremos **Tailwind CSS** + **Shadcn/UI** (recomendado pela rapidez).

1.  **AuthForm**: Card de login com Email/Senha.
2.  **Sidebar**: Navegação lateral responsiva (Itens mudam baseados no contexto Master/Client).
3.  **DataTable**: Tabela para listar usuários (Master) e serviços (Client).
4.  **StatsCard**: Card simples para exibir métricas.

## 6. Próximos Passos (Plano de Execução)

1.  **Setup**: Inicializar projeto Next.js na pasta `web` (Monorepo ou pasta separada?).
    *   *Sugestão: Criar pasta `frontend` na raiz atual.*
2.  **Middleware**: Configurar a lógica de roteamento de subdomínios.
3.  **Layouts**: Criar os layouts base para `(master)` e `(client)`.
4.  **Integração**: Conectar a página de dashboard com a API que já criamos.
