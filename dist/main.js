"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _core = require("@nestjs/core");
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _swagger = require("@nestjs/swagger");
const _path = require("path");
const _appmodule = require("./app.module");
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule);
    const configService = app.get(_config.ConfigService);
    // Serve static frontend files from /frontend folder FIRST
    // Use process.cwd() which works both with ts-node and compiled code
    const frontendPath = (0, _path.join)(process.cwd(), 'frontend');
    console.log('Serving static files from:', frontendPath);
    app.useStaticAssets(frontendPath, {
        prefix: '/',
        index: 'index.html'
    });
    // Global prefix for API routes
    const apiPrefix = configService.get('API_PREFIX', 'api/v1');
    app.setGlobalPrefix(apiPrefix);
    // Swagger API Documentation
    const swaggerConfig = new _swagger.DocumentBuilder().setTitle('Job Referral Platform API').setDescription('API documentation for the Job Referral & Pre-Screening Platform').setVersion('1.0').addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header'
    }, 'JWT-auth').addTag('auth', 'Authentication endpoints').addTag('jobs', 'Job management endpoints').addTag('tests', 'Test & assessment endpoints').addTag('payments', 'Payment processing endpoints').addTag('referrals', 'Referral management endpoints').addTag('admin', 'Admin dashboard endpoints').addTag('candidates', 'Candidate profile endpoints').build();
    const document = _swagger.SwaggerModule.createDocument(app, swaggerConfig);
    _swagger.SwaggerModule.setup('api/docs', app, document);
    // Validation
    app.useGlobalPipes(new _common.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true
        }
    }));
    // CORS - allow multiple origins for development
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
    ];
    app.enableCors({
        origin: (origin, callback)=>{
            // Allow requests with no origin (like mobile apps, curl, file://)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                // For development, allow all origins
                callback(null, true);
            }
        },
        credentials: true,
        methods: [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS'
        ],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'x-device-id',
            'x-razorpay-signature'
        ]
    });
    // Start server
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