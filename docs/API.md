# Referência da API CRM Agency

## Base URL
`/api`

## Autenticação
Todas as rotas protegidas requerem o cabeçalho `Authorization: Bearer <token>`.

## Rotas Públicas (Auth)

- `POST /auth/login`
  - Autentica um Admin ou User.
  - Body: `{ email, password }`
  - Response: `{ token, user: { id, name, role, slug? } }`

## Rotas Master (Admin)
Prefixo: `/api/master`

### Clientes
- `GET /clients` - Lista todos os clientes.
- `POST /clients` - Cria um novo cliente.
- `GET /clients/:id` - Detalhes de um cliente.
- `PUT /clients/:id` - Atualiza um cliente.

### Serviços Globais
- `GET /services` - Lista todos os serviços de todos os clientes.

## Rotas Client (User)
Prefixo: `/api/[client_slug]`

### Dashboard
- `GET /[client_slug]/dashboard` - Métricas gerais (faturas pendentes, tickets abertos, etc).

### Serviços
- `GET /[client_slug]/services` - Lista serviços contratados.
- `GET /[client_slug]/services/:id` - Detalhes de um serviço.

### Faturas (Invoices)
- `GET /[client_slug]/invoices` - Histórico de faturas.
- `GET /[client_slug]/invoices/:id` - Detalhes e link de pagamento.

### Tickets (Suporte)
- `GET /[client_slug]/tickets` - Lista de tickets.
- `POST /[client_slug]/tickets` - Abrir novo ticket.
- `POST /[client_slug]/tickets/:id/reply` - Responder a um ticket.

## Códigos de Status Comuns

- `200 OK`: Sucesso.
- `201 Created`: Recurso criado.
- `400 Bad Request`: Erro de validação.
- `401 Unauthorized`: Token ausente ou inválido.
- `403 Forbidden`: Sem permissão para acessar o recurso.
- `404 Not Found`: Recurso não encontrado.
- `500 Internal Server Error`: Erro no servidor.
