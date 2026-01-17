"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterController = void 0;
class MasterController {
    constructor(masterService) {
        this.masterService = masterService;
        this.getDashboard = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.masterService.getDashboardData();
                res.json(data);
            }
            catch (error) {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
        this.getUsers = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.masterService.getUsersList();
                res.json(data);
            }
            catch (error) {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
    }
}
exports.MasterController = MasterController;
