"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestTemplateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let TestTemplateService = class TestTemplateService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTemplate(dto) {
        if (dto.autoSelect) {
            const questionCount = await this.getAvailableQuestionCount(dto.selectionRoleType, dto.selectionTags);
            if (questionCount < dto.questionPoolSize) {
                throw new common_1.BadRequestException(`Not enough questions available. Found ${questionCount}, need ${dto.questionPoolSize}`);
            }
        }
        return this.prisma.testTemplate.create({
            data: {
                name: dto.name,
                description: dto.description,
                testType: dto.testType,
                duration: dto.duration,
                passingCriteria: dto.passingCriteria,
                questionPoolSize: dto.questionPoolSize,
                autoSelect: dto.autoSelect,
                selectionTags: dto.selectionTags || [],
                selectionRoleType: dto.selectionRoleType,
                allowSkip: dto.allowSkip ?? true,
                showLiveScore: dto.showLiveScore ?? false,
            },
        });
    }
    async getTemplates(filters) {
        const { page = 1, limit = 20, testType, isActive } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (testType)
            where.testType = testType;
        if (isActive !== undefined)
            where.isActive = isActive;
        const [templates, total] = await Promise.all([
            this.prisma.testTemplate.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    skillBuckets: {
                        select: { id: true, code: true, name: true },
                    },
                    _count: {
                        select: { testSessions: true },
                    },
                },
            }),
            this.prisma.testTemplate.count({ where }),
        ]);
        return {
            templates,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getTemplateById(id) {
        const template = await this.prisma.testTemplate.findUnique({
            where: { id },
            include: {
                skillBuckets: {
                    select: { id: true, code: true, name: true },
                },
            },
        });
        if (!template) {
            throw new common_1.NotFoundException('Test template not found');
        }
        const questionCount = await this.getAvailableQuestionCount(template.selectionRoleType, template.selectionTags);
        return {
            ...template,
            availableQuestions: questionCount,
        };
    }
    async updateTemplate(id, dto) {
        await this.getTemplateById(id);
        return this.prisma.testTemplate.update({
            where: { id },
            data: dto,
        });
    }
    async deleteTemplate(id) {
        const template = await this.getTemplateById(id);
        if (template.skillBuckets && template.skillBuckets.length > 0) {
            throw new common_1.BadRequestException('Cannot delete template that is assigned to skill buckets. Unassign first.');
        }
        return this.prisma.testTemplate.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async assignToSkillBucket(templateId, dto) {
        const template = await this.getTemplateById(templateId);
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: { id: dto.skillBucketId },
        });
        if (!skillBucket) {
            throw new common_1.NotFoundException('Skill bucket not found');
        }
        await this.prisma.skillBucket.update({
            where: { id: dto.skillBucketId },
            data: { testTemplateId: templateId },
        });
        return {
            success: true,
            message: `Template "${template.name}" assigned to skill bucket "${skillBucket.name}"`,
        };
    }
    async unassignFromSkillBucket(skillBucketId) {
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: { id: skillBucketId },
        });
        if (!skillBucket) {
            throw new common_1.NotFoundException('Skill bucket not found');
        }
        await this.prisma.skillBucket.update({
            where: { id: skillBucketId },
            data: { testTemplateId: null },
        });
        return {
            success: true,
            message: `Template unassigned from skill bucket "${skillBucket.name}"`,
        };
    }
    async getAvailableQuestionCount(roleType, tags) {
        const where = { isActive: true };
        if (roleType)
            where.roleType = roleType;
        if (tags && tags.length > 0) {
            where.tags = { hasSome: tags };
        }
        return this.prisma.questionBank.count({ where });
    }
    async previewQuestions(templateId, count = 10) {
        const template = await this.getTemplateById(templateId);
        const where = { isActive: true };
        if (template.selectionRoleType)
            where.roleType = template.selectionRoleType;
        if (template.selectionTags && template.selectionTags.length > 0) {
            where.tags = { hasSome: template.selectionTags };
        }
        const questions = await this.prisma.questionBank.findMany({
            where,
            take: count,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                question: true,
                difficulty: true,
                category: true,
                tags: true,
            },
        });
        return questions;
    }
};
exports.TestTemplateService = TestTemplateService;
exports.TestTemplateService = TestTemplateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TestTemplateService);
//# sourceMappingURL=test-template.service.js.map