import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

// Enable WebSocket for Neon serverless
neonConfig.webSocketConstructor = WebSocket;

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {

    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        const connectionString = process.env.DATABASE_URL;

        // Log the connection string presence (not value) for debugging
        console.log('DATABASE_URL present:', !!connectionString);
        console.log('DATABASE_URL length:', connectionString?.length || 0);

        if (!connectionString) {
            console.error('DATABASE_URL is not set! Available env vars:', Object.keys(process.env).filter(k => k.includes('DATA') || k.includes('DB')));
            throw new Error('DATABASE_URL environment variable is not set');
        }

        // Create Neon connection pool
        const pool = new Pool({ connectionString });
        // Cast to any to fix type compatibility between @neondatabase/serverless and @prisma/adapter-neon
        const adapter = new PrismaNeon(pool as any);

        super({
            adapter,
            log:
                process.env.NODE_ENV === 'development'
                    ? ['query', 'info', 'warn', 'error']
                    : ['error'],
        });

        this.logger.log('PrismaService initialized with Neon adapter');
        this.logger.log('Connection string host:', connectionString.match(/@([^/]+)/)?.[1] || 'unknown');
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
