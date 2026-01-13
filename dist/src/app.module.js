"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const jwt_1 = require("@nestjs/jwt");
const prisma_module_1 = require("./prisma/prisma.module");
const email_1 = require("./modules/email");
const guards_1 = require("./common/guards");
const filters_1 = require("./common/filters");
const interceptors_1 = require("./common/interceptors");
const auth_module_1 = require("./modules/auth/auth.module");
const candidate_module_1 = require("./modules/candidate/candidate.module");
const job_module_1 = require("./modules/job/job.module");
const test_module_1 = require("./modules/test/test.module");
const payment_module_1 = require("./modules/payment/payment.module");
const referral_module_1 = require("./modules/referral/referral.module");
const admin_module_1 = require("./modules/admin/admin.module");
const hr_module_1 = require("./modules/hr/hr.module");
const employee_module_1 = require("./modules/employee/employee.module");
const skill_bucket_module_1 = require("./modules/skill-bucket/skill-bucket.module");
const question_bank_module_1 = require("./modules/question-bank/question-bank.module");
const test_template_module_1 = require("./modules/test-template/test-template.module");
const rapid_fire_module_1 = require("./modules/rapid-fire/rapid-fire.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    throttlers: [
                        {
                            ttl: config.get('THROTTLE_TTL', 60) * 1000,
                            limit: config.get('THROTTLE_LIMIT', 100),
                        },
                    ],
                }),
            }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                global: true,
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET'),
                    signOptions: {
                        expiresIn: config.get('JWT_ACCESS_EXPIRY', '15m'),
                    },
                }),
            }),
            prisma_module_1.PrismaModule,
            email_1.EmailModule,
            auth_module_1.AuthModule,
            candidate_module_1.CandidateModule,
            job_module_1.JobModule,
            test_module_1.TestModule,
            payment_module_1.PaymentModule,
            referral_module_1.ReferralModule,
            admin_module_1.AdminModule,
            hr_module_1.HRModule,
            employee_module_1.EmployeeModule,
            skill_bucket_module_1.SkillBucketModule,
            question_bank_module_1.QuestionBankModule,
            test_template_module_1.TestTemplateModule,
            rapid_fire_module_1.RapidFireModule,
        ],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: filters_1.AllExceptionsFilter,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: interceptors_1.TransformInterceptor,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: guards_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: guards_1.RolesGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map