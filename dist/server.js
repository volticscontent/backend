"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/env");
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 3000;
console.log('Starting server...');
const server = app_1.default.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`👉 Master API: http://localhost:${PORT}/api/master`);
    console.log(`👉 Client API: http://localhost:${PORT}/api/[client_slug]`);
});
// Debugging: Prevent process from exiting immediately if something is wrong
setInterval(() => {
    // Keep alive
}, 10000);
process.on('exit', (code) => {
    console.log(`Process exiting with code: ${code}`);
});
process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
