"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get BulkQuestionDto () {
        return BulkQuestionDto;
    },
    get BulkUploadDto () {
        return BulkUploadDto;
    },
    get CreateQuestionDto () {
        return CreateQuestionDto;
    },
    get QuestionCategory () {
        return QuestionCategory;
    },
    get QuestionDifficulty () {
        return QuestionDifficulty;
    },
    get QuestionFiltersDto () {
        return QuestionFiltersDto;
    },
    get UpdateQuestionDto () {
        return UpdateQuestionDto;
    }
});
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
var QuestionDifficulty = /*#__PURE__*/ function(QuestionDifficulty) {
    QuestionDifficulty["EASY"] = "EASY";
    QuestionDifficulty["MEDIUM"] = "MEDIUM";
    QuestionDifficulty["HARD"] = "HARD";
    return QuestionDifficulty;
}({});
var QuestionCategory = /*#__PURE__*/ function(QuestionCategory) {
    QuestionCategory["TECHNICAL"] = "TECHNICAL";
    QuestionCategory["BEHAVIORAL"] = "BEHAVIORAL";
    QuestionCategory["APTITUDE"] = "APTITUDE";
    QuestionCategory["DOMAIN_SPECIFIC"] = "DOMAIN_SPECIFIC";
    return QuestionCategory;
}({});
let CreateQuestionDto = class CreateQuestionDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateQuestionDto.prototype, "question", void 0);
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    }),
    _ts_metadata("design:type", Array)
], CreateQuestionDto.prototype, "options", void 0);
_ts_decorate([
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(0),
    (0, _classvalidator.Max)(3),
    _ts_metadata("design:type", Number)
], CreateQuestionDto.prototype, "correctAnswer", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateQuestionDto.prototype, "explanation", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(QuestionDifficulty),
    _ts_metadata("design:type", String)
], CreateQuestionDto.prototype, "difficulty", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(QuestionCategory),
    _ts_metadata("design:type", String)
], CreateQuestionDto.prototype, "category", void 0);
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    }),
    _ts_metadata("design:type", Array)
], CreateQuestionDto.prototype, "tags", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateQuestionDto.prototype, "roleType", void 0);
let UpdateQuestionDto = class UpdateQuestionDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateQuestionDto.prototype, "question", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    }),
    _ts_metadata("design:type", Array)
], UpdateQuestionDto.prototype, "options", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(0),
    (0, _classvalidator.Max)(3),
    _ts_metadata("design:type", Number)
], UpdateQuestionDto.prototype, "correctAnswer", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateQuestionDto.prototype, "explanation", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(QuestionDifficulty),
    _ts_metadata("design:type", String)
], UpdateQuestionDto.prototype, "difficulty", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(QuestionCategory),
    _ts_metadata("design:type", String)
], UpdateQuestionDto.prototype, "category", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    }),
    _ts_metadata("design:type", Array)
], UpdateQuestionDto.prototype, "tags", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateQuestionDto.prototype, "roleType", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], UpdateQuestionDto.prototype, "isActive", void 0);
let QuestionFiltersDto = class QuestionFiltersDto {
    constructor(){
        this.page = 1;
        this.limit = 20;
    }
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], QuestionFiltersDto.prototype, "roleType", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(QuestionDifficulty),
    _ts_metadata("design:type", String)
], QuestionFiltersDto.prototype, "difficulty", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(QuestionCategory),
    _ts_metadata("design:type", String)
], QuestionFiltersDto.prototype, "category", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], QuestionFiltersDto.prototype, "search", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    }),
    _ts_metadata("design:type", Array)
], QuestionFiltersDto.prototype, "tags", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    _ts_metadata("design:type", Number)
], QuestionFiltersDto.prototype, "page", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(100),
    _ts_metadata("design:type", Number)
], QuestionFiltersDto.prototype, "limit", void 0);
let BulkQuestionDto = class BulkQuestionDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BulkQuestionDto.prototype, "question", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BulkQuestionDto.prototype, "optionA", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BulkQuestionDto.prototype, "optionB", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BulkQuestionDto.prototype, "optionC", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BulkQuestionDto.prototype, "optionD", void 0);
_ts_decorate([
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(0),
    (0, _classvalidator.Max)(3),
    _ts_metadata("design:type", Number)
], BulkQuestionDto.prototype, "correctAnswer", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BulkQuestionDto.prototype, "explanation", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BulkQuestionDto.prototype, "difficulty", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BulkQuestionDto.prototype, "category", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BulkQuestionDto.prototype, "tags", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BulkQuestionDto.prototype, "roleType", void 0);
let BulkUploadDto = class BulkUploadDto {
};
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classtransformer.Type)(()=>BulkQuestionDto),
    _ts_metadata("design:type", Array)
], BulkUploadDto.prototype, "QuestionBank", void 0);

//# sourceMappingURL=index.js.map