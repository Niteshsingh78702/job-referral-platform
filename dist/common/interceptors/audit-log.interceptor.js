"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuditLogInterceptor", {
    enumerable: true,
    get: function() {
        return AuditLogInterceptor;
    }
});
const _common = require("@nestjs/common");
const _operators = require("rxjs/operators");
const _prismaservice = require("../../prisma/prisma.service");
const _constants = require("../constants");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AuditLogInterceptor = class AuditLogInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const method = request.method;
        const url = request.url;
        const ip = request.ip || request.headers['x-forwarded-for'];
        const userAgent = request.headers['user-agent'];
        // Determine action based on method
        let action;
        switch(method){
            case 'POST':
                action = _constants.AuditAction.CREATE;
                break;
            case 'PUT':
            case 'PATCH':
                action = _constants.AuditAction.UPDATE;
                break;
            case 'DELETE':
                action = _constants.AuditAction.DELETE;
                break;
            default:
                return next.handle();
        }
        return next.handle().pipe((0, _operators.tap)(async (response)=>{
            // Only log mutations
            if ([
                'POST',
                'PUT',
                'PATCH',
                'DELETE'
            ].includes(method)) {
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
                                method
                            }
                        }
                    });
                } catch (error) {
                    // Don't fail the request if audit logging fails
                    console.error('Audit log failed:', error);
                }
            }
        }));
    }
    extractEntityType(url) {
        // Extract entity type from URL (e.g., /api/v1/jobs/123 -> Job)
        const parts = url.split('/').filter(Boolean);
        const entityIndex = parts.findIndex((p)=>p === 'v1') + 1;
        const entity = parts[entityIndex] || 'Unknown';
        return entity.charAt(0).toUpperCase() + entity.slice(1, -1);
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
AuditLogInterceptor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], AuditLogInterceptor);

//# sourceMappingURL=audit-log.interceptor.js.map