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
exports.TestEventDto = exports.SubmitAnswerDto = exports.AddQuestionDto = exports.CreateTestDto = void 0;
const class_validator_1 = require("class-validator");
class CreateTestDto {
    title;
    description;
    duration = 30;
    passingScore = 70;
    totalQuestions = 20;
    shuffleQuestions = true;
    maxTabSwitches = 2;
    difficulty = 'MEDIUM';
}
exports.CreateTestDto = CreateTestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(180),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTestDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTestDto.prototype, "passingScore", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTestDto.prototype, "totalQuestions", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateTestDto.prototype, "shuffleQuestions", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTestDto.prototype, "maxTabSwitches", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "difficulty", void 0);
class AddQuestionDto {
    question;
    options;
    correctAnswer;
    explanation;
    points = 1;
}
exports.AddQuestionDto = AddQuestionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddQuestionDto.prototype, "question", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], AddQuestionDto.prototype, "options", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AddQuestionDto.prototype, "correctAnswer", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddQuestionDto.prototype, "explanation", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AddQuestionDto.prototype, "points", void 0);
class SubmitAnswerDto {
    questionId;
    selectedAnswer;
}
exports.SubmitAnswerDto = SubmitAnswerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitAnswerDto.prototype, "questionId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubmitAnswerDto.prototype, "selectedAnswer", void 0);
class TestEventDto {
    eventType;
    eventData;
}
exports.TestEventDto = TestEventDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestEventDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TestEventDto.prototype, "eventData", void 0);
//# sourceMappingURL=test.dto.js.map