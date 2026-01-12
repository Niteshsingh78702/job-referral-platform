import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {

    private readonly logger = new Logger(PrismaService.name);
    private pool: Pool;

    constructor() {
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is required');
        }

        // Create pg pool for standard PostgreSQL connection
        const pool = new Pool({ connectionString: databaseUrl });
        const adapter = new PrismaPg(pool);

        super({
            adapter,
            log:
                process.env.NODE_ENV === 'development'
                    ? ['query', 'info', 'warn', 'error']
                    : ['error'],
        });

        this.pool = pool;
        this.logger.log('PrismaService initialized with pg adapter');
    }

    async onModuleInit() {
        try {
            this.logger.log('Connecting to database...');
            await this.$connect();
            this.logger.log('Successfully connected to database');
        } catch (error) {
            this.logger.error('Failed to connect to database:', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        await this.pool.end();
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
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        throw lastError;
    }
}
