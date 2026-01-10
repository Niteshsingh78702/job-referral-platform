"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const prisma_service_1 = require("../../prisma/prisma.service");
const constants_1 = require("../constants");
let AuditLogInterceptor = class AuditLogInterceptor {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const method = request.method;
        const url = request.url;
        const ip = request.ip || request.headers['x-forwarded-for'];
        const userAgent = request.headers['user-agent'];
        let action;
        switch (method) {
            case 'POST':
                action = constants_1.AuditAction.CREATE;
                break;
            case 'PUT':
            case 'PATCH':
                action = constants_1.AuditAction.UPDATE;
                break;
            case 'DELETE':
                action = constants_1.AuditAction.DELETE;
                break;
            default:
                return next.handle();
        }
        return next.handle().pipe((0, operators_1.tap)(async (response) => {
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                try {
                    await this.prisma.auditLog.create({
                        data: {
                            userId: user?.id,
                            action,
                            entityType: this.extractEntityType(url),
                            entityId: response?.id || 'unknown',
                            newValue: method !== 'DELETE' ? response : undefined,
                            metadata: {
                                ip,
                                userAgent,
                                url,
                                method,
                            },
                        },
                    });
                }
                catch (error) {
                    console.error('Audit log failed:', error);
                }
            }
        }));
    }
    extractEntityType(url) {
        const parts = url.split('/').filter(Boolean);
        const entityIndex = parts.findIndex((p) => p === 'v1') + 1;
        const entity = parts[entityIndex] || 'Unknown';
        return entity.charAt(0).toUpperCase() + entity.slice(1, -1);
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogInterceptor);
//# sourceMappingURL=audit-log.interceptor.js.map