# Arquitetura do Sistema CRM Agency

## Visão Geral

O sistema é construído sobre uma arquitetura monolítica modular, utilizando Next.js para o frontend e Node.js/Express para o backend (API), compartilhando tipos e utilitários onde possível. O design é focado em multi-tenancy, onde uma única instância da aplicação serve múltiplos clientes com isolamento lógico de dados.

## Componentes Principais

### 1. Frontend (Next.js 16)

O frontend utiliza o App Router do Next.js e é dividido logicamente em duas grandes áreas através de Route Groups:

- **`(dashboard)` / Client Area**:
  - Acessível via subdomínio `dash` ou rota `/client`.
  - Interface dedicada ao cliente final.
  - Funcionalidades: Dashboard, Serviços, Faturas, Tickets, Relatórios.
  - Componentes Shadcn/UI personalizados para uma experiência "Notion-like".

- **`(admin)` / Master Area**:
  - Acessível via subdomínio `admin` ou rota `/master`.
  - Interface para gestão da agência.
  - Funcionalidades: Gestão de Clientes (CRUD), Visão Global de Serviços, Logs de Sistema.

### 2. Backend (Node.js/Express)

A API RESTful é estruturada seguindo princípios SOLID e Clean Architecture simplificada:

- **Controllers**: Recebem as requisições HTTP e validam entrada.
- **Services**: Contêm a lógica de negócio.
- **Repositories**: Abstração de acesso a dados (Prisma).
- **Middleware**: Autenticação (JWT), Tratamento de Erros, Logging.

### 3. Banco de Dados (PostgreSQL)

O esquema do banco de dados (Prisma) reflete a estrutura multi-tenant:

- **`Admin`**: Usuários com privilégios elevados (Master, Dev, Colaborador).
- **`User` (Client)**: Clientes da agência. Identificados por um `slug` único.
- **`Service`**: Serviços contratados por um cliente.
- **`Invoice`**: Faturas geradas para os serviços.
- **`Ticket`**: Solicitações de suporte.
- **`SystemLog`**: Auditoria de ações administrativas.

## Fluxos Principais

### Autenticação
- Login separado para Admins e Users.
- Geração de JWT com payload contendo Role e ID.
- Middleware de proteção verifica o token e as permissões de rota.

### Multi-tenancy
- O `slug` do cliente é fundamental para o isolamento.
- Rotas de cliente na API seguem o padrão `/api/[client_slug]/...`.
- O backend valida se o usuário autenticado pertence ao `slug` solicitado.

## Tecnologias e Bibliotecas Chave

- **Prisma ORM**: Para modelagem e acesso ao banco de dados.
- **Zod**: Validação de esquemas (frontend e backend).
- **Lucide React**: Ícones consistentes.
- **Recharts**: Visualização de dados nos dashboards.
