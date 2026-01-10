"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const path_1 = require("path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const apiPrefix = configService.get('API_PREFIX', 'api/v1');
    app.setGlobalPrefix(apiPrefix);
    const frontendPath = (0, path_1.join)(__dirname, '..', '..', 'frontend');
    console.log('Serving static files from:', frontendPath);
    app.useStaticAssets(frontendPath, {
        prefix: '/',
        index: 'index.html',
    });
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Job Referral Platform API')
        .setDescription('API documentation for the Job Referral & Pre-Screening Platform')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addTag('auth', 'Authentication endpoints')
        .addTag('jobs', 'Job management endpoints')
        .addTag('tests', 'Test & assessment endpoints')
        .addTag('payments', 'Payment processing endpoints')
        .addTag('referrals', 'Referral management endpoints')
        .addTag('admin', 'Admin dashboard endpoints')
        .addTag('candidates', 'Candidate profile endpoints')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
    ];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(null, true);
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-razorpay-signature'],
    });
    const port = configService.get('PORT', 3000);
    await app.listen(port);
    console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║   🚀 Job Referral Platform is running!                       ║
  ║                                                              ║
  ║   📍 Frontend: http://localhost:${port}                          ║
  ║   📍 API: http://localhost:${port}/${apiPrefix}                  ║
  ║   📚 Docs: http://localhost:${port}/api/docs                     ║
  ║   📌 Environment: ${configService.get('NODE_ENV', 'development')}                         ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
  `);
}
bootstrap();
//# sourceMappingURL=main.js.map