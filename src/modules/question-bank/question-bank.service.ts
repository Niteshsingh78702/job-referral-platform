import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateQuestionDto,
    UpdateQuestionDto,
    QuestionFiltersDto,
    BulkQuestionDto,
} from './dto';

@Injectable()
export class QuestionBankService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a single question
     */
    async createQuestion(dto: CreateQuestionDto, createdById: string) {
        // Validate options count
        if (dto.options.length !== 4) {
            throw new BadRequestException('Questions must have exactly 4 options');
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

    /**
     * Bulk upload questions (for CSV import)
     */
    async bulkUpload(QuestionBank: BulkQuestionDto[], createdById: string) {
        const createdQuestionBank: any[] = [];
        const errors: { row: number; error: string }[] = [];

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
                        difficulty: q.difficulty as any,
                        category: q.category as any,
                        tags,
                        roleType: q.roleType,
                        createdById,
                    },
                });
                createdQuestions.push(created);
            } catch (error) {
                errors.push({ row: i + 1, error: error.message });
            }
        }

        return {
            success: createdQuestions.length,
            failed: errors.length,
            errors,
        };
    }

    /**
     * Get questions with filters and pagination
     * Uses efficient indexed queries for performance
     */
    async getQuestions(filters: QuestionFiltersDto) {
        const { page = 1, limit = 20, roleType, difficulty, category, search, tags } = filters;
        const skip = (page - 1) * limit;

        const where: any = {
            isActive: true,
        };

        // Use indexed fields for filtering
        if (roleType) where.roleType = roleType;
        if (difficulty) where.difficulty = difficulty;
        if (category) where.category = category;

        // Search by question text
        if (search) {
            where.question = {
                contains: search,
                mode: 'insensitive',
            };
        }

        // Filter by tags (any match)
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
                    // Don't include explanation in list view for performance
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

    /**
     * Get a single question by ID
     */
    async getQuestionById(id: string) {
        const question = await this.prisma.questionBank.findUnique({
            where: { id },
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        return question;
    }

    /**
     * Update a question
     */
    async updateQuestion(id: string, dto: UpdateQuestionDto) {
        await this.getQuestionById(id); // Verify exists

        if (dto.options && dto.options.length !== 4) {
            throw new BadRequestException('Questions must have exactly 4 options');
        }

        return this.prisma.questionBank.update({
            where: { id },
            data: dto as any,
        });
    }

    /**
     * Soft delete a question
     */
    async deleteQuestion(id: string) {
        await this.getQuestionById(id); // Verify exists

        return this.prisma.questionBank.update({
            where: { id },
            data: { isActive: false },
        });
    }

    /**
     * Get random questions for rapid fire test
     * Uses efficient query to avoid loading all questions
     */
    async getRandomQuestions(params: {
        count: number;
        roleType?: string;
        tags?: string[];
        difficulty?: string;
    }) {
        const { count, roleType, tags, difficulty } = params;

        const where: any = { isActive: true };
        if (roleType) where.roleType = roleType;
        if (difficulty) where.difficulty = difficulty;
        if (tags && tags.length > 0) {
            where.tags = { hasSome: tags };
        }

        // Get total count
        const totalCount = await this.prisma.questionBank.count({ where });

        if (totalCount === 0) {
            return [];
        }

        // For large pools, use random skip strategy
        // For small pools, fetch all and shuffle
        if (totalCount > count * 2) {
            // Random sampling for large pools
            const QuestionBank: any[] = [];
            const usedIds = new Set<string>();

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
        } else {
            // Fetch all and shuffle for small pools
            const allQuestions = await this.prisma.questionBank.findMany({ where });
            return this.shuffleArray(allQuestions).slice(0, count);
        }
    }

    /**
     * Get statistics for admin dashboard
     */
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

    /**
     * Get unique role types for dropdown
     */
    async getRoleTypes() {
        const roles = await this.prisma.questionBank.findMany({
            where: { isActive: true, roleType: { not: null } },
            select: { roleType: true },
            distinct: ['roleType'],
        });

        return roles.map(r => r.roleType).filter(Boolean);
    }

    /**
     * Fisher-Yates shuffle algorithm
     */
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
