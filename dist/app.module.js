"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppModule", {
    enumerable: true,
    get: function() {
        return AppModule;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _core = require("@nestjs/core");
const _throttler = require("@nestjs/throttler");
const _jwt = require("@nestjs/jwt");
const _prismamodule = require("./prisma/prisma.module");
const _email = require("./modules/email");
const _guards = require("./common/guards");
const _filters = require("./common/filters");
const _interceptors = require("./common/interceptors");
const _authmodule = require("./modules/auth/auth.module");
const _candidatemodule = require("./modules/candidate/candidate.module");
const _jobmodule = require("./modules/job/job.module");
const _testmodule = require("./modules/test/test.module");
const _paymentmodule = require("./modules/payment/payment.module");
const _referralmodule = require("./modules/referral/referral.module");
const _adminmodule = require("./modules/admin/admin.module");
const _hrmodule = require("./modules/hr/hr.module");
const _employeemodule = require("./modules/employee/employee.module");
const _skillbucketmodule = require("./modules/skill-bucket/skill-bucket.module");
const _questionbankmodule = require("./modules/question-bank/question-bank.module");
const _testtemplatemodule = require("./modules/test-template/test-template.module");
const _rapidfiremodule = require("./modules/rapid-fire/rapid-fire.module");
const _cloudinarymodule = require("./modules/cloudinary/cloudinary.module");
const _resumeparsermodule = require("./modules/resume-parser/resume-parser.module");
const _interviewmodule = require("./modules/interview/interview.module");
const _appcontroller = require("./app.controller");
const _appservice = require("./app.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AppModule = class AppModule {
};
AppModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            // Configuration
            _config.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env'
            }),
            // Rate Limiting
            _throttler.ThrottlerModule.forRootAsync({
                imports: [
                    _config.ConfigModule
                ],
                inject: [
                    _config.ConfigService
                ],
                useFactory: (config)=>({
                        throttlers: [
                            {
                                ttl: config.get('THROTTLE_TTL', 60) * 1000,
                                limit: config.get('THROTTLE_LIMIT', 100)
                            }
                        ]
                    })
            }),
            // JWT (Global)
            _jwt.JwtModule.registerAsync({
                imports: [
                    _config.ConfigModule
                ],
                inject: [
                    _config.ConfigService
                ],
                global: true,
                useFactory: (config)=>({
                        secret: config.get('JWT_SECRET'),
                        signOptions: {
                            expiresIn: config.get('JWT_ACCESS_EXPIRY', '15m')
                        }
                    })
            }),
            // Database
            _prismamodule.PrismaModule,
            // Email (Global)
            _email.EmailModule,
            // Feature Modules
            _authmodule.AuthModule,
            _candidatemodule.CandidateModule,
            _jobmodule.JobModule,
            _testmodule.TestModule,
            _paymentmodule.PaymentModule,
            _referralmodule.ReferralModule,
            _adminmodule.AdminModule,
            _hrmodule.HRModule,
            _employeemodule.EmployeeModule,
            _skillbucketmodule.SkillBucketModule,
            _questionbankmodule.QuestionBankModule,
            _testtemplatemodule.TestTemplateModule,
            _rapidfiremodule.RapidFireModule,
            // File Upload & Resume Processing
            _cloudinarymodule.CloudinaryModule,
            _resumeparsermodule.ResumeParserModule,
            // Interview System
            _interviewmodule.InterviewModule
        ],
        controllers: [
            _appcontroller.AppController
        ],
        providers: [
            _appservice.AppService,
            // Global Exception Filter
            {
                provide: _core.APP_FILTER,
                useClass: _filters.AllExceptionsFilter
            },
            // Global Response Transform
            {
                provide: _core.APP_INTERCEPTOR,
                useClass: _interceptors.TransformInterceptor
            },
            // Global Auth Guard
            {
                provide: _core.APP_GUARD,
                useClass: _guards.JwtAuthGuard
            },
            // Global Roles Guard
            {
                provide: _core.APP_GUARD,
                useClass: _guards.RolesGuard
            },
            // Global Rate Limiting
            {
                provide: _core.APP_GUARD,
                useClass: _throttler.ThrottlerGuard
            }
        ]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map