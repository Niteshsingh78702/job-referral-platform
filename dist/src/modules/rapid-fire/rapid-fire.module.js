"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RapidFireModule = void 0;
const common_1 = require("@nestjs/common");
const rapid_fire_controller_1 = require("./rapid-fire.controller");
const rapid_fire_service_1 = require("./rapid-fire.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const question_bank_module_1 = require("../question-bank/question-bank.module");
let RapidFireModule = class RapidFireModule {
};
exports.RapidFireModule = RapidFireModule;
exports.RapidFireModule = RapidFireModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, question_bank_module_1.QuestionBankModule],
        controllers: [rapid_fire_controller_1.RapidFireController],
        providers: [rapid_fire_service_1.RapidFireTestService],
        exports: [rapid_fire_service_1.RapidFireTestService],
    })
], RapidFireModule);
//# sourceMappingURL=rapid-fire.module.js.map