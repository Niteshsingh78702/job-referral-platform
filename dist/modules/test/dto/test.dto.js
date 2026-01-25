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
    get AddQuestionDto () {
        return AddQuestionDto;
    },
    get CreateRoleTestDto () {
        return CreateRoleTestDto;
    },
    get CreateTestDto () {
        return CreateTestDto;
    },
    get SubmitAnswerDto () {
        return SubmitAnswerDto;
    },
    get TestEventDto () {
        return TestEventDto;
    },
    get UpdateTestDto () {
        return UpdateTestDto;
    }
});
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CreateTestDto = class CreateTestDto {
    constructor(){
        this.duration = 30;
        this.passingScore = 70;
        this.totalQuestions = 20;
        this.shuffleQuestions = true;
        this.maxTabSwitches = 2;
        this.difficulty = 'MEDIUM';
        this.validityDays = 7;
    }
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateTestDto.prototype, "title", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], CreateTestDto.prototype, "description", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(5),
    (0, _classvalidator.Max)(180),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], CreateTestDto.prototype, "duration", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    (0, _classvalidator.Max)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], CreateTestDto.prototype, "passingScore", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], CreateTestDto.prototype, "totalQuestions", void 0);
_ts_decorate([
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Boolean)
], CreateTestDto.prototype, "shuffleQuestions", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(5),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], CreateTestDto.prototype, "maxTabSwitches", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], CreateTestDto.prototype, "difficulty", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(30),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], CreateTestDto.prototype, "validityDays", void 0);
let CreateRoleTestDto = class CreateRoleTestDto {
    constructor(){
        this.duration = 30;
        this.passingScore = 70;
        this.totalQuestions = 20;
        this.validityDays = 7;
        this.isActive = false;
    }
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateRoleTestDto.prototype, "skillBucketId", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateRoleTestDto.prototype, "title", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], CreateRoleTestDto.prototype, "description", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(5),
    (0, _classvalidator.Max)(180),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], CreateRoleTestDto.prototype, "duration", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    (0, _classvalidator.Max)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], CreateRoleTestDto.prototype, "passingScore", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], CreateRoleTestDto.prototype, "totalQuestions", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(30),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], CreateRoleTestDto.prototype, "validityDays", void 0);
_ts_decorate([
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Boolean)
], CreateRoleTestDto.prototype, "isActive", void 0);
let UpdateTestDto = class UpdateTestDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateTestDto.prototype, "title", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateTestDto.prototype, "description", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(5),
    (0, _classvalidator.Max)(180),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], UpdateTestDto.prototype, "duration", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    (0, _classvalidator.Max)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], UpdateTestDto.prototype, "passingScore", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], UpdateTestDto.prototype, "totalQuestions", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(30),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], UpdateTestDto.prototype, "validityDays", void 0);
_ts_decorate([
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Boolean)
], UpdateTestDto.prototype, "isActive", void 0);
let AddQuestionDto = class AddQuestionDto {
    constructor(){
        this.points = 1;
    }
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], AddQuestionDto.prototype, "question", void 0);
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    _ts_metadata("design:type", Array)
], AddQuestionDto.prototype, "options", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    _ts_metadata("design:type", Number)
], AddQuestionDto.prototype, "correctAnswer", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], AddQuestionDto.prototype, "explanation", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], AddQuestionDto.prototype, "points", void 0);
let SubmitAnswerDto = class SubmitAnswerDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], SubmitAnswerDto.prototype, "questionId", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], SubmitAnswerDto.prototype, "selectedAnswer", void 0);
let TestEventDto = class TestEventDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], TestEventDto.prototype, "eventType", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Object)
], TestEventDto.prototype, "eventData", void 0);

//# sourceMappingURL=test.dto.js.map