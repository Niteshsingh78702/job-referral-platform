"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthModule", {
    enumerable: true,
    get: function() {
        return AuthModule;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
const _authcontroller = require("./auth.controller");
const _services = require("./services");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AuthModule = class AuthModule {
};
AuthModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _jwt.JwtModule.registerAsync({
                imports: [
                    _config.ConfigModule
                ],
                useFactory: async (configService)=>({
                        secret: configService.get('JWT_SECRET'),
                        signOptions: {
                            expiresIn: configService.get('JWT_ACCESS_EXPIRY', '15m')
                        }
                    }),
                inject: [
                    _config.ConfigService
                ]
            })
        ],
        controllers: [
            _authcontroller.AuthController
        ],
        providers: [
            _services.AuthService,
            _services.OtpService,
            _services.TokenService,
            _services.GoogleAuthService
        ],
        exports: [
            _services.AuthService,
            _services.TokenService,
            _services.GoogleAuthService
        ]
    })
], AuthModule);

//# sourceMappingURL=auth.module.js.map