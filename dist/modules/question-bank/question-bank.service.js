"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "QuestionBankService", {
    enumerable: true,
    get: function() {
        return QuestionBankService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../../prisma/prisma.service");
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
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
let QuestionBankService = class QuestionBankService {
    /**
   * Create a single question
   */ async createQuestion(dto, createdById) {
        // Validate options count
        if (dto.options.length !== 4) {
            throw new _common.BadRequestException('Questions must have exactly 4 options');
        }
        return this.prisma.questionBank.create({
            data: {
                id: _crypto.randomUUID(),
                question: dto.question,
                options: dto.options,
                correctAnswer: dto.correctAnswer,
                explanation: dto.explanation,
                difficulty: dto.difficulty,
                category: dto.category,
                tags: dto.tags,
                roleType: dto.roleType,
                createdById,
                updatedAt: new Date()
            }
        });
    }
    /**
   * Bulk upload questions (for CSV import)
   */ async bulkUpload(questions, createdById) {
        const createdQuestions = [];
        const errors = [];
        for(let i = 0; i < questions.length; i++){
            const q = questions[i];
            try {
                const options = [
                    q.optionA,
                    q.optionB,
                    q.optionC,
                    q.optionD
                ];
                const tags = q.tags ? q.tags.split('|').map((t)=>t.trim()) : [];
                const created = await this.prisma.questionBank.create({
                    data: {
                        id: _crypto.randomUUID(),
                        question: q.question,
                        options,
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation,
                        difficulty: q.difficulty,
                        category: q.category,
                        tags,
                        roleType: q.roleType,
                        createdById,
                        updatedAt: new Date()
                    }
                });
                createdQuestions.push(created);
            } catch (error) {
                errors.push({
                    row: i + 1,
                    error: error.message
                });
            }
        }
        return {
            success: createdQuestions.length,
            failed: errors.length,
            errors
        };
    }
    /**
   * Get questions with filters and pagination
   * Uses efficient indexed queries for performance
   */ async getQuestions(filters) {
        const { page = 1, limit = 20, roleType, difficulty, category, search, tags } = filters;
        const skip = (page - 1) * limit;
        const where = {
            isActive: true
        };
        // Use indexed fields for filtering
        if (roleType) where.roleType = roleType;
        if (difficulty) where.difficulty = difficulty;
        if (category) where.category = category;
        // Search by question text
        if (search) {
            where.question = {
                contains: search,
                mode: 'insensitive'
            };
        }
        // Filter by tags (any match)
        if (tags && tags.length > 0) {
            where.tags = {
                hasSome: tags
            };
        }
        const [questions, total] = await Promise.all([
            this.prisma.questionBank.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    id: true,
                    question: true,
                    options: true,
                    correctAnswer: true,
                    difficulty: true,
                    category: true,
                    tags: true,
                    roleType: true,
                    createdAt: true
                }
            }),
            this.prisma.questionBank.count({
                where
            })
        ]);
        return {
            questions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
   * Get a single question by ID
   */ async getQuestionById(id) {
        const question = await this.prisma.questionBank.findUnique({
            where: {
                id
            }
        });
        if (!question) {
            throw new _common.NotFoundException('Question not found');
        }
        return question;
    }
    /**
   * Update a question
   */ async updateQuestion(id, dto) {
        await this.getQuestionById(id); // Verify exists
        if (dto.options && dto.options.length !== 4) {
            throw new _common.BadRequestException('Questions must have exactly 4 options');
        }
        return this.prisma.questionBank.update({
            where: {
                id
            },
            data: dto
        });
    }
    /**
   * Soft delete a question
   */ async deleteQuestion(id) {
        await this.getQuestionById(id); // Verify exists
        return this.prisma.questionBank.update({
            where: {
                id
            },
            data: {
                isActive: false
            }
        });
    }
    /**
   * Get random questions for rapid fire test
   * Uses efficient query to avoid loading all questions
   * De-duplicates questions by their text content to ensure unique questions
   */ async getRandomQuestions(params) {
        const { count, roleType, tags, difficulty } = params;
        const where = {
            isActive: true
        };
        if (roleType) where.roleType = roleType;
        if (difficulty) where.difficulty = difficulty;
        if (tags && tags.length > 0) {
            where.tags = {
                hasSome: tags
            };
        }
        // Log the query parameters for debugging
        console.log(`[QuestionBank] Fetching random questions: roleType=${roleType}, count=${count}`);
        // Fetch all questions - use a random orderBy to ensure different starting order each time
        // This helps with randomization and avoids database-level caching effects
        const orderOptions = [
            {
                createdAt: 'asc'
            },
            {
                createdAt: 'desc'
            },
            {
                id: 'asc'
            },
            {
                id: 'desc'
            }
        ];
        const randomOrderBy = orderOptions[_crypto.randomInt(0, orderOptions.length)];
        const allQuestions = await this.prisma.questionBank.findMany({
            where,
            orderBy: randomOrderBy
        });
        console.log(`[QuestionBank] Found ${allQuestions.length} total questions for roleType=${roleType}`);
        // De-duplicate by question text (normalized: trimmed and lowercased)
        const seenTexts = new Set();
        const uniqueQuestions = allQuestions.filter((q)=>{
            // Normalize the question text - remove trailing numbers in parentheses like "(52)"
            const normalizedText = q.question.replace(/\s*\(\d+\)\s*$/, '').trim().toLowerCase();
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
        console.log(`[QuestionBank] Returning ${selected.length} randomly selected questions. First 3 IDs: ${selected.slice(0, 3).map((q)=>q.id).join(', ')}`);
        return selected;
    }
    /**
   * Get statistics for admin dashboard
   */ async getStats() {
        const [total, byRole, byDifficulty, byCategory] = await Promise.all([
            this.prisma.questionBank.count({
                where: {
                    isActive: true
                }
            }),
            this.prisma.questionBank.groupBy({
                by: [
                    'roleType'
                ],
                where: {
                    isActive: true
                },
                _count: true
            }),
            this.prisma.questionBank.groupBy({
                by: [
                    'difficulty'
                ],
                where: {
                    isActive: true
                },
                _count: true
            }),
            this.prisma.questionBank.groupBy({
                by: [
                    'category'
                ],
                where: {
                    isActive: true
                },
                _count: true
            })
        ]);
        return {
            total,
            byRole: byRole.map((r)=>({
                    roleType: r.roleType || 'Unassigned',
                    count: r._count
                })),
            byDifficulty: byDifficulty.map((d)=>({
                    difficulty: d.difficulty,
                    count: d._count
                })),
            byCategory: byCategory.map((c)=>({
                    category: c.category,
                    count: c._count
                }))
        };
    }
    /**
   * Get unique role types for dropdown
   */ async getRoleTypes() {
        const roles = await this.prisma.questionBank.findMany({
            where: {
                isActive: true,
                roleType: {
                    not: null
                }
            },
            select: {
                roleType: true
            },
            distinct: [
                'roleType'
            ]
        });
        return roles.map((r)=>r.roleType).filter(Boolean);
    }
    /**
   * Fisher-Yates shuffle algorithm using crypto for better randomness
   */ shuffleArray(array) {
        const shuffled = [
            ...array
        ];
        for(let i = shuffled.length - 1; i > 0; i--){
            // Use crypto.randomInt for cryptographically secure randomness
            const j = _crypto.randomInt(0, i + 1);
            [shuffled[i], shuffled[j]] = [
                shuffled[j],
                shuffled[i]
            ];
        }
        return shuffled;
    }
    /**
   * Bulk delete all questions by role type
   */ async deleteByRole(roleType) {
        const result = await this.prisma.questionBank.deleteMany({
            where: {
                roleType
            }
        });
        return result.count;
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
QuestionBankService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], QuestionBankService);

//# sourceMappingURL=question-bank.service.js.map