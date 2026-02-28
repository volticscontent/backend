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
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const marketing_routes_1 = require("./routes/marketing.routes");
const tracking_routes_1 = require("./routes/tracking.routes");
const cms_routes_1 = require("./routes/cms.routes");
const credential_routes_1 = require("./routes/credential.routes");
const seo_routes_1 = require("./routes/seo.routes");
const campaign_routes_1 = require("./routes/campaign.routes");
const checkout_routes_1 = require("./routes/checkout.routes");
const form_routes_1 = require("./routes/form.routes");
const stripe_global_routes_1 = __importDefault(require("./routes/stripe-global.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Log incoming requests
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    console.log(`[Params]`, req.params);
    console.log(`[Query]`, req.query);
    next();
});
// Rota de Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// 1. Prioridade: Rotas Master (/api/master)
app.use('/api/master', master_routes_1.default);
// 2. Rotas Globais/Específicas (Não usam slug no path)
app.use('/api/auth', auth_routes_1.default);
app.use('/api/marketing', marketing_routes_1.marketingRoutes);
app.use('/api/tracking', tracking_routes_1.trackingRoutes);
app.use('/api/cms', cms_routes_1.cmsRoutes);
app.use('/api/credentials', credential_routes_1.credentialRoutes);
app.use('/api/seo', seo_routes_1.seoRoutes);
app.use('/api/forms', form_routes_1.formRoutes);
app.use('/api/stripe', stripe_global_routes_1.default);
app.use('/api', campaign_routes_1.campaignRoutes);
app.use('/api', checkout_routes_1.checkoutRoutes);
// 3. Fallback: Rotas de Cliente (/api/:clientSlug)
// Onde :clientSlug será o identificador do usuário/cliente
app.use('/api/:clientSlug', client_routes_1.default);
exports.default = app;
