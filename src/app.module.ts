import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';

// Core
import { PrismaModule } from './prisma/prisma.module';

// Common
import { JwtAuthGuard, RolesGuard } from './common/guards';
import { AllExceptionsFilter } from './common/filters';
import { TransformInterceptor } from './common/interceptors';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { CandidateModule } from './modules/candidate/candidate.module';
import { JobModule } from './modules/job/job.module';
import { TestModule } from './modules/test/test.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReferralModule } from './modules/referral/referral.module';
import { AdminModule } from './modules/admin/admin.module';
import { HRModule } from './modules/hr/hr.module';
import { EmployeeModule } from './modules/employee/employee.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL', 60) * 1000,
            limit: config.get('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    // JWT (Global)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_ACCESS_EXPIRY', '15m'),
        },
      }),
    }),

    // Database
    PrismaModule,

    // Feature Modules
    AuthModule,
    CandidateModule,
    JobModule,
    TestModule,
    PaymentModule,
    ReferralModule,
    AdminModule,
    HRModule,
    EmployeeModule,
  ],
  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // Global Response Transform
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // Global Auth Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global Roles Guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // Global Rate Limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
