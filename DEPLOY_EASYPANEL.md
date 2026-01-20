# Guia de Deploy no Easypanel + Traefik

Como sua infraestrutura usa **Easypanel** com **Traefik**, o processo é muito mais simples e visual. Você não precisa gerenciar o `docker-compose` manualmente no servidor.

## Estrutura do Projeto no Easypanel

Você criará 3 serviços dentro de um Projeto no Easypanel:
1.  **Banco de Dados** (PostgreSQL)
2.  **Backend** (Node.js/Express)
3.  **Frontend** (Next.js)

---

### 1. Criar o Projeto
1.  No painel do Easypanel, clique em **"Create Project"**.
2.  Nomeie como `rds` (ou o nome que preferir).

---

### 2. Criar o Banco de Dados (PostgreSQL)
1.  Dentro do projeto, clique em **"Service"** -> **"Database"** -> **"PostgreSQL"**.
2.  Nome: `db` (ou `postgres`).
3.  Crie o serviço.
4.  Após criado, vá nas configurações do serviço e anote a **Internal Connection URL** (algo como `postgres://postgres:password@db:5432/rds`).
    *   *Dica: No Easypanel, serviços no mesmo projeto se comunicam pelo nome do serviço (ex: host é `db`).*

---

### 3. Criar o Backend (App Service)
1.  Clique em **"Service"** -> **"App"**.
2.  Nome: `backend`.
3.  **Source**:
    *   Selecione **GitHub**.
    *   Escolha o repositório `rds`.
    *   Branch: `main`.
4.  **Build**:
    *   **Method**: Dockerfile
    *   **Dockerhelper Path**: `./Dockerfile` (Padrão, na raiz).
5.  **Environment** (Abra a aba Environment):
    *   `DATABASE_URL`: Cole a URL interna do banco que você criou (ex: `postgres://postgres:senha@db:5432/rds`).
    *   `JWT_SECRET`: Defina uma senha segura.
    *   `PORT`: `3001`.
6.  **Network / Domains**:
    *   Port: `3001` (Porta do container).
    *   **Domain**: Adicione seu domínio (ex: `api.seusite.com`). O Traefik gerencia o SSL automaticamente.
7.  Clique em **"Create"** ou **"Deploy"**.

**Importante - Migrations**:
Após o deploy do backend (mesmo que falhe na primeira vez por falta de tabelas), você precisa rodar as migrations.
1.  No Easypanel, abra o console do serviço `backend`.
2.  Execute: `npx prisma migrate deploy`
3.  (Opcional) Seed: `npx prisma db seed`

---

### 4. Criar o Frontend (App Service)
1.  Clique em **"Service"** -> **"App"**.
2.  Nome: `frontend`.
3.  **Source**:
    *   Selecione **GitHub**.
    *   Escolha o repositório `rds`.
4.  **Build**:
    *   **Root Directory**: `/frontend` (Isso é crucial! O build deve rodar dentro da pasta frontend).
    *   **Method**: Dockerfile
    *   **Dockerfile Path**: `./Dockerfile` (Relativo ao Root Directory).
5.  **Environment**:
    *   **Importante**: Para o Next.js, a URL da API precisa estar disponível no **Build Time**.
    *   Adicione `NEXT_PUBLIC_API_URL` com o domínio público do seu backend (ex: `https://api.seusite.com`).
    *   Certifique-se de marcar essa variável como **"Build Arg"** se o Easypanel tiver essa opção separada, ou apenas como variável de ambiente (o Dockerfile está configurado para ler ENV como ARG).
6.  **Network / Domains**:
    *   Port: `3000`.
    *   **Domain**: Adicione seu domínio principal (ex: `app.seusite.com`).
7.  Clique em **"Create"** ou **"Deploy"**.

---

### Resumo da Configuração
| Serviço | Tipo | Caminho Dockerfile | Porta | Domínio (Exemplo) | Variáveis Chave |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **db** | PostgreSQL | N/A | 5432 | N/A (Interno) | `POSTGRES_PASSWORD` (Auto) |
| **backend** | App | `./Dockerfile` | 3001 | `api.seusite.com` | `DATABASE_URL`, `JWT_SECRET` |
| **frontend** | App | `frontend/Dockerfile` | 3000 | `app.seusite.com` | `NEXT_PUBLIC_API_URL` |

### Solução de Problemas
*   **Erro de Build no Frontend**: Verifique se o "Root Directory" está configurado para `/frontend`.
*   **Backend não conecta no Banco**: Verifique se a `DATABASE_URL` usa o nome do serviço do banco (ex: `db`) e não `localhost`.
*   **CORS**: Se o frontend der erro de CORS, verifique no código do backend (`server.ts` ou `app.ts`) se a origem `https://app.seusite.com` está permitida.
