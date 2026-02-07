"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppService", {
    enumerable: true,
    get: function() {
        return AppService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("./prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AppService = class AppService {
    getHello() {
        return 'Hello World!';
    }
    async getPublicTestimonials(limit = 6) {
        return this.prisma.testimonial.findMany({
            where: {
                isActive: true
            },
            orderBy: [
                {
                    displayOrder: 'asc'
                },
                {
                    createdAt: 'desc'
                }
            ],
            take: limit
        });
    }
    async getPublicSettings() {
        const settings = await this.prisma.siteSettings.findMany({
            where: {
                key: {
                    in: [
                        'interviews_scheduled',
                        'candidates_selected'
                    ]
                }
            }
        });
        const result = {
            interviewsScheduled: 127,
            candidatesSelected: 38
        };
        settings.forEach((s)=>{
            if (s.key === 'interviews_scheduled') result.interviewsScheduled = parseInt(s.value) || 127;
            if (s.key === 'candidates_selected') result.candidatesSelected = parseInt(s.value) || 38;
        });
        return result;
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
AppService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], AppService);

//# sourceMappingURL=app.service.js.map