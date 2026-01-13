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
exports.QuestionBankService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let QuestionBankService = class QuestionBankService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createQuestion(dto, createdById) {
        if (dto.options.length !== 4) {
            throw new common_1.BadRequestException('Questions must have exactly 4 options');
        }
        return this.prisma.questionBank.create({
            data: {
                question: dto.question,
                options: dto.options,
                correctAnswer: dto.correctAnswer,
                explanation: dto.explanation,
                difficulty: dto.difficulty,
                category: dto.category,
                tags: dto.tags,
                roleType: dto.roleType,
                createdById,
            },
        });
    }
    async bulkUpload(questions, createdById) {
        const createdQuestions = [];
        const errors = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            try {
                const options = [q.optionA, q.optionB, q.optionC, q.optionD];
                const tags = q.tags ? q.tags.split('|').map(t => t.trim()) : [];
                const created = await this.prisma.questionBank.create({
                    data: {
                        question: q.question,
                        options,
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation,
                        difficulty: q.difficulty,
                        category: q.category,
                        tags,
                        roleType: q.roleType,
                        createdById,
                    },
                });
                createdQuestions.push(created);
            }
            catch (error) {
                errors.push({ row: i + 1, error: error.message });
            }
        }
        return {
            success: createdQuestions.length,
            failed: errors.length,
            errors,
        };
    }
    async getQuestions(filters) {
        const { page = 1, limit = 20, roleType, difficulty, category, search, tags } = filters;
        const skip = (page - 1) * limit;
        const where = {
            isActive: true,
        };
        if (roleType)
            where.roleType = roleType;
        if (difficulty)
            where.difficulty = difficulty;
        if (category)
            where.category = category;
        if (search) {
            where.question = {
                contains: search,
                mode: 'insensitive',
            };
        }
        if (tags && tags.length > 0) {
            where.tags = {
                hasSome: tags,
            };
        }
        const [questions, total] = await Promise.all([
            this.prisma.questionBank.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    question: true,
                    options: true,
                    correctAnswer: true,
                    difficulty: true,
                    category: true,
                    tags: true,
                    roleType: true,
                    createdAt: true,
                },
            }),
            this.prisma.questionBank.count({ where }),
        ]);
        return {
            questions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getQuestionById(id) {
        const question = await this.prisma.questionBank.findUnique({
            where: { id },
        });
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        return question;
    }
    async updateQuestion(id, dto) {
        await this.getQuestionById(id);
        if (dto.options && dto.options.length !== 4) {
            throw new common_1.BadRequestException('Questions must have exactly 4 options');
        }
        return this.prisma.questionBank.update({
            where: { id },
            data: dto,
        });
    }
    async deleteQuestion(id) {
        await this.getQuestionById(id);
        return this.prisma.questionBank.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async getRandomQuestions(params) {
        const { count, roleType, tags, difficulty } = params;
        const where = { isActive: true };
        if (roleType)
            where.roleType = roleType;
        if (difficulty)
            where.difficulty = difficulty;
        if (tags && tags.length > 0) {
            where.tags = { hasSome: tags };
        }
        const totalCount = await this.prisma.questionBank.count({ where });
        if (totalCount === 0) {
            return [];
        }
        if (totalCount > count * 2) {
            const questions = [];
            const usedIds = new Set();
            while (questions.length < count && questions.length < totalCount) {
                const skip = Math.floor(Math.random() * totalCount);
                const [question] = await this.prisma.questionBank.findMany({
                    where,
                    skip,
                    take: 1,
                });
                if (question && !usedIds.has(question.id)) {
                    usedIds.add(question.id);
                    questions.push(question);
                }
            }
            return questions;
        }
        else {
            const allQuestions = await this.prisma.questionBank.findMany({ where });
            return this.shuffleArray(allQuestions).slice(0, count);
        }
    }
    async getStats() {
        const [total, byRole, byDifficulty, byCategory] = await Promise.all([
            this.prisma.questionBank.count({ where: { isActive: true } }),
            this.prisma.questionBank.groupBy({
                by: ['roleType'],
                where: { isActive: true },
                _count: true,
            }),
            this.prisma.questionBank.groupBy({
                by: ['difficulty'],
                where: { isActive: true },
                _count: true,
            }),
            this.prisma.questionBank.groupBy({
                by: ['category'],
                where: { isActive: true },
                _count: true,
            }),
        ]);
        return {
            total,
            byRole: byRole.map(r => ({ roleType: r.roleType || 'Unassigned', count: r._count })),
            byDifficulty: byDifficulty.map(d => ({ difficulty: d.difficulty, count: d._count })),
            byCategory: byCategory.map(c => ({ category: c.category, count: c._count })),
        };
    }
    async getRoleTypes() {
        const roles = await this.prisma.questionBank.findMany({
            where: { isActive: true, roleType: { not: null } },
            select: { roleType: true },
            distinct: ['roleType'],
        });
        return roles.map(r => r.roleType).filter(Boolean);
    }
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};
exports.QuestionBankService = QuestionBankService;
exports.QuestionBankService = QuestionBankService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuestionBankService);
//# sourceMappingURL=question-bank.service.js.map