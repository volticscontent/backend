# Especificação de Frontend e UI/UX - CRM Agency

Este documento define a separação lógica dos registros (autenticação), a estrutura dos frontends e as interfaces de usuário (UI) mínimas viáveis para o desenvolvimento inicial.

## 1. Separação de Registros e Autenticação

Embora o backend seja unificado, a experiência de acesso é segregada pelo subdomínio.

### A. Fluxo Master (Admin)
- **URL**: `https://admin.agency.com`
- **Público**: Donos da agência, desenvolvedores, colaboradores.
- **Tabela no DB**: `Admin`
- **Tela de Login**:
  - Visual sóbrio/técnico.
  - Campos: Email, Senha.
  - *Não possui auto-cadastro público.* (Admins são criados por outros Admins com permissão Master).

### B. Fluxo Cliente (User)
- **URL**: `https://dash.agency.com` (ou domínio personalizado do cliente).
- **Público**: Clientes finais da agência.
- **Tabela no DB**: `User`
- **Tela de Login**:
  - Visual amigável, com branding da agência.
  - Campos: Email, Senha.
  - *Recuperação de senha simplificada.*

---

## 2. Estrutura dos Frontends (Next.js App Router)

Teremos um único projeto Next.js (Monorepo lógico), mas com layouts totalmente distintos baseados no `Route Group`.

### `/app/(auth)`
Layout minimalista, centralizado, fundo limpo.
- `/login`: Detecta se é `admin` ou `dash` via hostname e exibe o formulário correto e faz o POST para a rota de auth correta (`/api/auth/master` ou `/api/auth/client`).

### `/app/(master)`
Layout denso em informações, focado em produtividade.
- **Sidebar Escura/Lateral**:
  - Dashboard (Visão Geral)
  - Clientes (CRUD de Users)
  - Logs do Sistema (Tabela `System`)
  - Configurações (Gerenciamento de Admins)

### `/app/(client)`
Layout limpo, focado em consumo de informação.
- **Sidebar Clara ou Topbar**:
  - Início (Resumo da conta)
  - Meus Serviços (Lista de serviços ativos)
  - Credenciais (Gerenciamento de chaves de API)
  - Suporte

---

## 3. UIs Mínimas (Componentes Essenciais)

Utilizaremos **Tailwind CSS** + **Shadcn/UI** (Radix Primitives) para agilidade.

### Componentes Globais (Design System)
1.  **Button**: Variantes `default` (primary), `outline` (secondary), `ghost` (menu), `destructive` (excluir).
2.  **Input/Form**: Com validação (React Hook Form + Zod).
3.  **Card**: Container padrão para agrupar informações (Stats, Detalhes).
4.  **Table (Data Table)**:
    - Componente crítico para o Master.
    - Features: Paginação, Busca, Filtros.
5.  **Badge/Status**: Para mostrar status de serviços (Ativo, Pendente, Cancelado).
6.  **Dialog/Modal**: Para ações de confirmação ou edições rápidas.
7.  **Toast**: Notificações de sucesso/erro.

### Telas Mínimas para MVP (Prioridade de Desenvolvimento)

#### Fase 1: Autenticação
- [ ] **Login Page**: Componente único que muda título/cor baseada no domínio.
- [ ] **Auth Handler**: Integração com API para validar sessão (JWT/Cookie).

#### Fase 2: Painel Master
- [ ] **Lista de Clientes (User Table)**:
    - Colunas: Nome, Email, Slug, Status, Ações (Ver, Editar).
    - Botão "Novo Cliente": Abre Modal ou vai para página de criação.
- [ ] **Detalhe do Cliente**:
    - Ver logs do cliente (`UserSystem`).
    - Ver credenciais associadas.

#### Fase 3: Painel Cliente
- [ ] **Dashboard Home**:
    - Card de boas-vindas.
    - Resumo de uso (placeholder).
- [ ] **Gerenciador de Credenciais**:
    - Tabela simples listando chaves de API.
    - Botão "Gerar Nova Chave" (Cria registro na tabela `Credential`).

---

## 4. Stack Tecnológico Frontend
- **Framework**: Next.js 14+ (App Router).
- **Estilização**: Tailwind CSS.
- **Componentes**: Shadcn/UI (Reutilizáveis).
- **Ícones**: Lucide React.
- **State Management**: React Query (TanStack Query) - *Essencial para cache e sincronia com API*.
- **Forms**: React Hook Form + Zod.
