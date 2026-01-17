# CRM Agency

**CRM Multi-tenant para Agências Digitais**

O **CRM Agency** é uma plataforma completa projetada para agências digitais gerenciarem seus clientes, serviços, faturas e tickets de suporte de forma centralizada e eficiente. A arquitetura multi-tenant permite que cada cliente tenha seu próprio portal personalizado, enquanto a agência mantém o controle total através de um painel administrativo mestre.

## 🚀 Tecnologias

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), [Shadcn/UI](https://ui.shadcn.com/), Tailwind CSS, Lucide React.
- **Backend**: Node.js, Express, TypeScript.
- **Banco de Dados**: PostgreSQL (gerenciado via [Prisma ORM](https://www.prisma.io/)).
- **Autenticação**: JWT (JSON Web Tokens) e Bcrypt.

## 🏗️ Arquitetura

O projeto segue uma arquitetura modular e segura:

- **Multi-tenancy**:
  - **Master (Admin)**: Acesso via subdomínio `admin` (ou rota `/master`). Gerencia clientes, serviços globais e configurações do sistema.
  - **Client (User)**: Acesso via subdomínio `dash` (ou rota `/client`). Visualiza serviços contratados, faturas, tickets e relatórios.
- **API**:
  - Separação clara de rotas: `/api/master/*` para operações administrativas e `/api/[client_slug]/*` para operações de clientes.
- **Frontend**:
  - Uso de Route Groups do Next.js `(auth)`, `(dashboard)` para separar layouts e contextos.
  - Middleware para roteamento baseado em subdomínio e proteção de rotas.

## 📦 Instalação e Uso

### Pré-requisitos

- Node.js (v18+)
- PostgreSQL

### Configuração

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/volticscontent/rds-.git
   cd rds-
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   Crie um arquivo `.env` na raiz do projeto com base no `.env.example` (se houver) ou configure:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   JWT_SECRET="sua_chave_secreta"
   PORT=3000
   ```

4. **Banco de Dados**:
   Execute as migrações e o seed inicial:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

## 📚 Documentação

Para detalhes mais aprofundados sobre a arquitetura e a API, consulte a pasta `docs/`:

- [Arquitetura do Sistema](docs/ARCHITECTURE.md)
- [Referência da API](docs/API.md)

## 👥 Contribuição

1. Fork o projeto.
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`).
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`).
4. Push para a branch (`git push origin feature/nova-feature`).
5. Abra um Pull Request.

---
Desenvolvido por **Voltics Content**.
