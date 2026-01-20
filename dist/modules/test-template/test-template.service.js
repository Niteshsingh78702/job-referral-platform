"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TestTemplateService", {
    enumerable: true,
    get: function() {
        return TestTemplateService;
    }
});
const _common = require("@nestjs/common");
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _prismaservice = require("../../prisma/prisma.service");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let TestTemplateService = class TestTemplateService {
    /**
     * Create a new test template
     */ async createTemplate(dto) {
        // Validate that question pool is available if auto-select
        if (dto.autoSelect) {
            const questionCount = await this.getAvailableQuestionCount(dto.selectionRoleType, dto.selectionTags);
            if (questionCount < dto.questionPoolSize) {
                throw new _common.BadRequestException(`Not enough questions available. Found ${questionCount}, need ${dto.questionPoolSize}`);
            }
        }
        return this.prisma.testTemplate.create({
            data: {
                id: _crypto.randomUUID(),
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
                updatedAt: new Date()
            }
        });
    }
    /**
     * Get templates with filters and pagination
     */ async getTemplates(filters) {
        const { page = 1, limit = 20, testType, isActive } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (testType) where.testType = testType;
        if (isActive !== undefined) where.isActive = isActive;
        const [templates, total] = await Promise.all([
            this.prisma.testTemplate.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    SkillBucket: {
                        select: {
                            id: true,
                            code: true,
                            name: true
                        }
                    },
                    _count: {
                        select: {
                            TestSession: true
                        }
                    }
                }
            }),
            this.prisma.testTemplate.count({
                where
            })
        ]);
        return {
            templates,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Get a single template by ID
     */ async getTemplateById(id) {
        const template = await this.prisma.testTemplate.findUnique({
            where: {
                id
            },
            include: {
                SkillBucket: {
                    select: {
                        id: true,
                        code: true,
                        name: true
                    }
                }
            }
        });
        if (!template) {
            throw new _common.NotFoundException('Test template not found');
        }
        // Get available question count
        const questionCount = await this.getAvailableQuestionCount(template.selectionRoleType, template.selectionTags);
        return {
            ...template,
            availableQuestionBank: questionCount
        };
    }
    /**
     * Update a template
     */ async updateTemplate(id, dto) {
        await this.getTemplateById(id); // Verify exists
        return this.prisma.testTemplate.update({
            where: {
                id
            },
            data: dto
        });
    }
    /**
     * Delete a template (soft delete)
     */ async deleteTemplate(id) {
        const template = await this.getTemplateById(id);
        // Check if assigned to any skill bucket
        if (template.skillBuckets && template.skillBuckets.length > 0) {
            throw new _common.BadRequestException('Cannot delete template that is assigned to skill buckets. Unassign first.');
        }
        return this.prisma.testTemplate.update({
            where: {
                id
            },
            data: {
                isActive: false
            }
        });
    }
    /**
     * Assign template to a skill bucket
     */ async assignToSkillBucket(templateId, dto) {
        const template = await this.getTemplateById(templateId);
        // Check if skill bucket exists
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: {
                id: dto.skillBucketId
            }
        });
        if (!skillBucket) {
            throw new _common.NotFoundException('Skill bucket not found');
        }
        // Update skill bucket to link to this template
        await this.prisma.skillBucket.update({
            where: {
                id: dto.skillBucketId
            },
            data: {
                testTemplateId: templateId
            }
        });
        return {
            success: true,
            message: `Template "${template.name}" assigned to skill bucket "${skillBucket.name}"`
        };
    }
    /**
     * Unassign template from a skill bucket
     */ async unassignFromSkillBucket(skillBucketId) {
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: {
                id: skillBucketId
            }
        });
        if (!skillBucket) {
            throw new _common.NotFoundException('Skill bucket not found');
        }
        await this.prisma.skillBucket.update({
            where: {
                id: skillBucketId
            },
            data: {
                testTemplateId: null
            }
        });
        return {
            success: true,
            message: `Template unassigned from skill bucket "${skillBucket.name}"`
        };
    }
    /**
     * Get available question count for a template's selection criteria
     */ async getAvailableQuestionCount(roleType, tags) {
        const where = {
            isActive: true
        };
        if (roleType) where.roleType = roleType;
        if (tags && tags.length > 0) {
            where.tags = {
                hasSome: tags
            };
        }
        return this.prisma.questionBank.count({
            where
        });
    }
    /**
     * Preview questions that would be selected for a template
     */ async previewQuestions(templateId, count = 10) {
        const template = await this.getTemplateById(templateId);
        const where = {
            isActive: true
        };
        if (template.selectionRoleType) where.roleType = template.selectionRoleType;
        if (template.selectionTags && template.selectionTags.length > 0) {
            where.tags = {
                hasSome: template.selectionTags
            };
        }
        const questions = await this.prisma.questionBank.findMany({
            where,
            take: count,
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                question: true,
                difficulty: true,
                category: true,
                tags: true
            }
        });
        return questions;
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
TestTemplateService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], TestTemplateService);

//# sourceMappingURL=test-template.service.js.map