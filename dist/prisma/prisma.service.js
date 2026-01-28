"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PrismaService", {
    enumerable: true,
    get: function() {
        return PrismaService;
    }
});
const _common = require("@nestjs/common");
const _client = require("@prisma/client");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PrismaService = class PrismaService extends _client.PrismaClient {
    async onModuleInit() {
        await this.connectWithRetry();
        // Start keep-alive ping every 4 minutes to prevent Neon idle disconnect
        this.startKeepAlive();
    }
    startKeepAlive() {
        // Ping every 4 minutes (240000ms) - Neon typically disconnects after 5 mins idle
        const PING_INTERVAL = 4 * 60 * 1000;
        this.keepAliveInterval = setInterval(async ()=>{
            try {
                await this.$queryRaw`SELECT 1`;
                this.logger.debug('Database keep-alive ping successful');
            } catch (error) {
                this.logger.warn('Keep-alive ping failed, attempting reconnect...');
                try {
                    await this.connectWithRetry(3);
                } catch (reconnectError) {
                    this.logger.error('Keep-alive reconnect failed:', reconnectError);
                }
            }
        }, PING_INTERVAL);
        this.logger.log('Database keep-alive started (interval: 4 minutes)');
    }
    async connectWithRetry(maxRetries = 5) {
        for(let attempt = 1; attempt <= maxRetries; attempt++){
            try {
                this.logger.log(`Connecting to database (attempt ${attempt}/${maxRetries})...`);
                await this.$connect();
                // Warm up the connection with a simple query
                await this.$queryRaw`SELECT 1`;
                this.logger.log('Successfully connected to database');
                return;
            } catch (error) {
                this.logger.warn(`Connection attempt ${attempt} failed: ${error.message}`);
                if (attempt === maxRetries) {
                    this.logger.error('Failed to connect to database after all retries:', error);
                    throw error;
                }
                // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 16000);
                this.logger.log(`Retrying in ${delay / 1000}s...`);
                await new Promise((resolve)=>setTimeout(resolve, delay));
            }
        }
    }
    // Reconnect if connection is lost (handles Neon cold starts)
    async ensureConnection() {
        try {
            await this.$queryRaw`SELECT 1`;
        } catch  {
            this.logger.warn('Connection lost, reconnecting...');
            await this.connectWithRetry(3);
        }
    }
    async onModuleDestroy() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
            this.logger.log('Database keep-alive stopped');
        }
        await this.$disconnect();
    }
    // Helper for transactions with retry
    async executeInTransaction(fn, maxRetries = 3) {
        let lastError;
        for(let attempt = 1; attempt <= maxRetries; attempt++){
            try {
                return await this.$transaction(fn, {
                    maxWait: 30000,
                    timeout: 30000
                });
            } catch (error) {
                lastError = error;
                this.logger.warn(`Transaction attempt ${attempt} failed: ${error.message}`);
                if (attempt < maxRetries) {
                    await new Promise((resolve)=>setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        throw lastError;
    }
    constructor(){
        super({
            log: process.env.NODE_ENV === 'development' ? [
                'query',
                'info',
                'warn',
                'error'
            ] : [
                'error'
            ]
        }), this.logger = new _common.Logger(PrismaService.name), this.keepAliveInterval = null;
        this.logger.log('PrismaService initialized');
        // Add middleware to handle connection errors and auto-reconnect
        this.$use(async (params, next)=>{
            const maxRetries = 3;
            let lastError;
            for(let attempt = 1; attempt <= maxRetries; attempt++){
                try {
                    return await next(params);
                } catch (error) {
                    lastError = error;
                    // Check if it's a connection error
                    const isConnectionError = error.message?.includes('Connection') || error.message?.includes('Closed') || error.message?.includes('ECONNREFUSED') || error.message?.includes('ETIMEDOUT') || error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1017';
                    if (isConnectionError && attempt < maxRetries) {
                        this.logger.warn(`Connection error on ${params.model}.${params.action} (attempt ${attempt}/${maxRetries}): ${error.message}`);
                        // Reconnect
                        try {
                            await this.$disconnect();
                            await new Promise((resolve)=>setTimeout(resolve, 500 * attempt));
                            await this.$connect();
                            this.logger.log('Reconnected to database');
                        } catch (reconnectError) {
                            this.logger.error('Failed to reconnect:', reconnectError);
                        }
                    } else {
                        throw error;
                    }
                }
            }
            throw lastError;
        });
    }
};
PrismaService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], PrismaService);

//# sourceMappingURL=prisma.service.js.map