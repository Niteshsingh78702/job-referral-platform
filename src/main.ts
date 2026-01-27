import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Serve static frontend files from /frontend folder FIRST
  // Use process.cwd() which works both with ts-node and compiled code
  const frontendPath = join(process.cwd(), 'frontend');
  console.log('Serving static files from:', frontendPath);

  app.useStaticAssets(frontendPath, {
    prefix: '/',
    index: 'index.html',
  });

  // Global prefix for API routes
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Job Referral Platform API')
    .setDescription(
      'API documentation for the Job Referral & Pre-Screening Platform',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('jobs', 'Job management endpoints')
    .addTag('tests', 'Test & assessment endpoints')
    .addTag('payments', 'Payment processing endpoints')
    .addTag('referrals', 'Referral management endpoints')
    .addTag('admin', 'Admin dashboard endpoints')
    .addTag('candidates', 'Candidate profile endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS - allow multiple origins for development
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];

  app.enableCors({
    origin: (origin, callback) => {
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
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-device-id',
      'x-razorpay-signature',
    ],
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
