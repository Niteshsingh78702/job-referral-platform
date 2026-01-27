"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AllExceptionsFilter", {
    enumerable: true,
    get: function() {
        return AllExceptionsFilter;
    }
});
const _common = require("@nestjs/common");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = _common.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errors = null;
        if (exception instanceof _common.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const responseObj = exceptionResponse;
                message = responseObj.message || message;
                errors = responseObj.errors || null;
                // Preserve any additional data (like sessionId for active sessions)
                if (responseObj.sessionId) {
                    errors = {
                        ...errors,
                        sessionId: responseObj.sessionId,
                        status: responseObj.status
                    };
                }
            }
        } else if (exception instanceof Error) {
            message = exception.message;
        }
        // Log error in development
        if (process.env.NODE_ENV !== 'production') {
            console.error('Exception:', exception);
        }
        response.status(status).json({
            success: false,
            statusCode: status,
            message,
            errors,
            timestamp: new Date().toISOString(),
            path: request.url
        });
    }
};
AllExceptionsFilter = _ts_decorate([
    (0, _common.Catch)()
], AllExceptionsFilter);

//# sourceMappingURL=all-exceptions.filter.js.map