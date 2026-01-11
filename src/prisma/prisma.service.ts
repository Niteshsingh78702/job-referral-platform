import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {

    private static instance: PrismaClient | null = null;

    constructor() {
        // Create connection pool with increased timeout for Render's free tier
        const connectionString = process.env.DATABASE_URL;
        const pool = new Pool({
            connectionString,
            connectionTimeoutMillis: 30000, // 30 seconds connection timeout
            idleTimeoutMillis: 30000,
            max: 10,
        });

        // Create adapter
        const adapter = new PrismaPg(pool);

        super({
            adapter,
            log:
                process.env.NODE_ENV === 'development'
                    ? ['query', 'info', 'warn', 'error']
                    : ['error'],
            transactionOptions: {
                maxWait: 30000, // 30 seconds max wait for transaction
                timeout: 30000, // 30 seconds transaction timeout
            },
        });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    // Helper for transactions
    async executeInTransaction<T>(
        fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
    ): Promise<T> {
        return this.$transaction(fn);
    }
}
