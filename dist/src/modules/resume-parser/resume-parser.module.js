"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeParserModule = void 0;
const common_1 = require("@nestjs/common");
const resume_parser_service_1 = require("./resume-parser.service");
let ResumeParserModule = class ResumeParserModule {
};
exports.ResumeParserModule = ResumeParserModule;
exports.ResumeParserModule = ResumeParserModule = __decorate([
    (0, common_1.Module)({
        providers: [resume_parser_service_1.ResumeParserService],
        exports: [resume_parser_service_1.ResumeParserService],
    })
], ResumeParserModule);
//# sourceMappingURL=resume-parser.module.js.map