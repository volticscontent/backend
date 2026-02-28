# Guia de Deploy na Vercel

A Vercel é a plataforma ideal para o Frontend (Next.js), mas também pode hospedar o Backend (Node.js) com algumas adaptações.

Existem duas abordagens principais:

## Opção 1: Híbrida (Recomendada)
**Frontend na Vercel** + **Backend no Easypanel/VPS**

Esta é a arquitetura mais robusta. O Frontend ganha a performance da Edge Network da Vercel, e o Backend mantém a conexão persistente e WebSocket do servidor tradicional.

### 1. Deploy do Frontend (Vercel)
1.  Acesse [vercel.com](https://vercel.com) e clique em **Add New...** -> **Project**.
2.  Importe seu repositório do GitHub.
3.  Configure o projeto:
    *   **Framework Preset:** Next.js
    *   **Root Directory:** Clique em "Edit" e selecione a pasta `frontend`.
    *   **Environment Variables:**
        *   `NEXT_PUBLIC_API_URL`: A URL do seu backend rodando no Easypanel (ex: `https://api.seusite.com`).
4.  Clique em **Deploy**.

---

## Opção 2: Fullstack na Vercel
**Frontend e Backend na Vercel**

Você pode hospedar tudo na Vercel, mas o Backend rodará como **Serverless Functions**.
*   **Prós:** Custo inicial zero, infraestrutura única.
*   **Contras:** "Cold starts" (primeira requisição lenta), limite de tempo de execução (10s no plano free), conexões de banco de dados podem estourar o limite (precisa de connection pooling).

### Configuração para o Backend na Vercel

Para que o Express rode na Vercel, precisamos criar um arquivo de configuração `vercel.json` na raiz e um ponto de entrada para a função serverless.

1.  **Crie o arquivo `vercel.json` na raiz do projeto:**
    ```json
    {
      "version": 2,
      "builds": [
        {
          "src": "src/server.ts",
          "use": "@vercel/node"
        }
      ],
      "routes": [
        {
          "src": "/api/(.*)",
          "dest": "src/server.ts"
        }
      ]
    }
    ```

2.  **Ajuste no código (Importante):**
    Serverless functions não usam `app.listen()`. A Vercel espera que você exporte a função handler.
    *   Garanta que `src/app.ts` exporte o `app` (já faz isso).
    *   O `src/server.ts` precisa verificar se está rodando na Vercel ou localmente.

### Deploy do Backend na Vercel
1.  Crie um **novo projeto** na Vercel (separado do frontend).
2.  Importe o mesmo repositório.
3.  **Root Directory:** Deixe como `.` (raiz).
4.  **Build Command:** `npm run build` (ou `tsc`).
5.  **Output Directory:** `dist`.
6.  **Environment Variables:**
    *   `DATABASE_URL`: URL do banco de dados (Use um banco externo como Supabase, Neon ou Railway).
    *   `JWT_SECRET`: Sua senha secreta.
7.  Clique em **Deploy**.

> **Atenção com Banco de Dados:** Como serverless functions abrem e fecham muitas conexões, bancos tradicionais (Postgres simples) podem falhar. Recomenda-se usar **Supabase** ou **Neon** que lidam bem com serverless, ou usar **Prisma Accelerate**.
