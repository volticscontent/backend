"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const master_routes_1 = __importDefault(require("./routes/master.routes"));
const client_routes_1 = __importDefault(require("./routes/client.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rota de Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Rotas da API
// 1. Prioridade: Rotas Master (/api/master)
app.use('/api/master', master_routes_1.default);
// 2. Fallback: Rotas de Cliente (/api/:clientSlug)
// Onde :clientSlug será o identificador do usuário/cliente
app.use('/api/:clientSlug', client_routes_1.default);
exports.default = app;
