import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {

    private static instance: PrismaClient | null = null;
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        // Create connection pool with settings for Render's PostgreSQL
        const connectionString = process.env.DATABASE_URL;

        // Log connection attempt (without showing full URL for security)
        const isRender = connectionString?.includes('render') || connectionString?.includes('neon');
        console.log(`Connecting to database... (is cloud: ${isRender})`);

        const pool = new Pool({
            connectionString,
            connectionTimeoutMillis: 30000, // 30 seconds connection timeout
            idleTimeoutMillis: 30000,
            max: 5, // Reduce pool size for free tier
            // SSL required for Render and Neon databases
            ssl: connectionString?.includes('localhost') ? false : { rejectUnauthorized: false },
        });

        // Create adapter
        const adapter = new PrismaPg(pool);

        super({
            adapter,
            log:
                process.env.NODE_ENV === 'development'
                    ? ['query', 'info', 'warn', 'error']
                    : ['error'],
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Successfully connected to database');
        } catch (error) {
            this.logger.error('Failed to connect to database:', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    // Helper for transactions with retry
    async executeInTransaction<T>(
        fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
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
                this.logger.warn(`Transaction attempt ${attempt} failed: ${(error as Error).message}`);

                if (attempt < maxRetries) {
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        throw lastError;
    }
}
