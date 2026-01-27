import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });

    this.logger.log('PrismaService initialized');
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(maxRetries = 5): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(
          `Connecting to database (attempt ${attempt}/${maxRetries})...`,
        );
        await this.$connect();

        // Warm up the connection with a simple query
        await this.$queryRaw`SELECT 1`;

        this.logger.log('Successfully connected to database');
        return;
      } catch (error) {
        this.logger.warn(
          `Connection attempt ${attempt} failed: ${(error as Error).message}`,
        );

        if (attempt === maxRetries) {
          this.logger.error(
            'Failed to connect to database after all retries:',
            error,
          );
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 16000);
        this.logger.log(`Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Reconnect if connection is lost (handles Neon cold starts)
  async ensureConnection(): Promise<void> {
    try {
      await this.$queryRaw`SELECT 1`;
    } catch {
      this.logger.warn('Connection lost, reconnecting...');
      await this.connectWithRetry(3);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper for transactions with retry
  async executeInTransaction<T>(
    fn: (
      prisma: Omit<
        PrismaClient,
        | '$connect'
        | '$disconnect'
        | '$on'
        | '$transaction'
        | '$use'
        | '$extends'
      >,
    ) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.$transaction(fn, {
          maxWait: 30000,
          timeout: 30000,
        });
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Transaction attempt ${attempt} failed: ${(error as Error).message}`,
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError;
  }
}
