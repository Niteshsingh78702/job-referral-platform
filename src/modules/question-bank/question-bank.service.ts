import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
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
        id: crypto.randomUUID(),
        question: dto.question,
        options: dto.options,
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation,
        difficulty: dto.difficulty,
        category: dto.category,
        tags: dto.tags,
        roleType: dto.roleType,
        createdById,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Bulk upload questions (for CSV import)
   */
  async bulkUpload(questions: BulkQuestionDto[], createdById: string) {
    const createdQuestions: any[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      try {
        const options = [q.optionA, q.optionB, q.optionC, q.optionD];
        const tags = q.tags ? q.tags.split('|').map((t) => t.trim()) : [];

        const created = await this.prisma.questionBank.create({
          data: {
            id: crypto.randomUUID(),
            question: q.question,
            options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty as any,
            category: q.category as any,
            tags,
            roleType: q.roleType,
            createdById,
            updatedAt: new Date(),
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
    const {
      page = 1,
      limit = 20,
      roleType,
      difficulty,
      category,
      search,
      tags,
    } = filters;
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
   * De-duplicates questions by their text content to ensure unique questions
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

    // Log the query parameters for debugging
    console.log(`[QuestionBank] Fetching random questions: roleType=${roleType}, count=${count}`);

    // Fetch all questions - use a random orderBy to ensure different starting order each time
    // This helps with randomization and avoids database-level caching effects
    const orderOptions = [
      { createdAt: 'asc' as const },
      { createdAt: 'desc' as const },
      { id: 'asc' as const },
      { id: 'desc' as const },
    ];
    const randomOrderBy = orderOptions[crypto.randomInt(0, orderOptions.length)];

    const allQuestions = await this.prisma.questionBank.findMany({
      where,
      orderBy: randomOrderBy,
    });

    console.log(`[QuestionBank] Found ${allQuestions.length} total questions for roleType=${roleType}`);

    // De-duplicate by question text (normalized: trimmed and lowercased)
    const seenTexts = new Set<string>();
    const uniqueQuestions = allQuestions.filter(q => {
      // Normalize the question text - remove trailing numbers in parentheses like "(52)"
      const normalizedText = q.question
        .replace(/\s*\(\d+\)\s*$/, '')
        .trim()
        .toLowerCase();

      if (seenTexts.has(normalizedText)) {
        return false; // Skip duplicate
      }
      seenTexts.add(normalizedText);
      return true;
    });

    console.log(`[QuestionBank] After de-duplication: ${uniqueQuestions.length} unique questions`);

    if (uniqueQuestions.length === 0) {
      console.warn(`[QuestionBank] No questions available for roleType=${roleType}`);
      return [];
    }

    // Shuffle and return the requested count
    const shuffled = this.shuffleArray(uniqueQuestions);
    const selected = shuffled.slice(0, count);

    console.log(`[QuestionBank] Returning ${selected.length} randomly selected questions. First 3 IDs: ${selected.slice(0, 3).map(q => q.id).join(', ')}`);

    return selected;
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
      byRole: byRole.map((r) => ({
        roleType: r.roleType || 'Unassigned',
        count: r._count,
      })),
      byDifficulty: byDifficulty.map((d) => ({
        difficulty: d.difficulty,
        count: d._count,
      })),
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count,
      })),
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

    return roles.map((r) => r.roleType).filter(Boolean);
  }

  /**
   * Fisher-Yates shuffle algorithm using crypto for better randomness
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Use crypto.randomInt for cryptographically secure randomness
      const j = crypto.randomInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Bulk delete all questions by role type
   */
  async deleteByRole(roleType: string): Promise<number> {
    const result = await this.prisma.questionBank.deleteMany({
      where: { roleType },
    });
    return result.count;
  }
}
