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
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
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
                            id: _crypto.randomUUID(),
                            userId: user?.sub || user?.id,
                            action,
                            entityType: this.extractEntityType(url),
                            entityId: response?.id || response?.data?.id || 'unknown',
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