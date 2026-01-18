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
    get AssignTemplateDto () {
        return AssignTemplateDto;
    },
    get CreateTestTemplateDto () {
        return CreateTestTemplateDto;
    },
    get TemplateFiltersDto () {
        return TemplateFiltersDto;
    },
    get TestType () {
        return TestType;
    },
    get UpdateTestTemplateDto () {
        return UpdateTestTemplateDto;
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
var TestType = /*#__PURE__*/ function(TestType) {
    TestType["STANDARD"] = "STANDARD";
    TestType["RAPID_FIRE"] = "RAPID_FIRE";
    return TestType;
}({});
let CreateTestTemplateDto = class CreateTestTemplateDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateTestTemplateDto.prototype, "name", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateTestTemplateDto.prototype, "description", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(TestType),
    _ts_metadata("design:type", String)
], CreateTestTemplateDto.prototype, "testType", void 0);
_ts_decorate([
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(5),
    (0, _classvalidator.Max)(60),
    _ts_metadata("design:type", Number)
], CreateTestTemplateDto.prototype, "duration", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(50),
    (0, _classvalidator.Max)(100),
    _ts_metadata("design:type", Number)
], CreateTestTemplateDto.prototype, "passingCriteria", void 0);
_ts_decorate([
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(10),
    (0, _classvalidator.Max)(500),
    _ts_metadata("design:type", Number)
], CreateTestTemplateDto.prototype, "questionPoolSize", void 0);
_ts_decorate([
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], CreateTestTemplateDto.prototype, "autoSelect", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    }),
    _ts_metadata("design:type", Array)
], CreateTestTemplateDto.prototype, "selectionTags", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateTestTemplateDto.prototype, "selectionRoleType", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], CreateTestTemplateDto.prototype, "allowSkip", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], CreateTestTemplateDto.prototype, "showLiveScore", void 0);
let UpdateTestTemplateDto = class UpdateTestTemplateDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateTestTemplateDto.prototype, "name", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateTestTemplateDto.prototype, "description", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(5),
    (0, _classvalidator.Max)(60),
    _ts_metadata("design:type", Number)
], UpdateTestTemplateDto.prototype, "duration", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(50),
    (0, _classvalidator.Max)(100),
    _ts_metadata("design:type", Number)
], UpdateTestTemplateDto.prototype, "passingCriteria", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(10),
    (0, _classvalidator.Max)(500),
    _ts_metadata("design:type", Number)
], UpdateTestTemplateDto.prototype, "questionPoolSize", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], UpdateTestTemplateDto.prototype, "autoSelect", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    }),
    _ts_metadata("design:type", Array)
], UpdateTestTemplateDto.prototype, "selectionTags", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateTestTemplateDto.prototype, "selectionRoleType", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], UpdateTestTemplateDto.prototype, "allowSkip", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], UpdateTestTemplateDto.prototype, "showLiveScore", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], UpdateTestTemplateDto.prototype, "isActive", void 0);
let AssignTemplateDto = class AssignTemplateDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], AssignTemplateDto.prototype, "skillBucketId", void 0);
let TemplateFiltersDto = class TemplateFiltersDto {
    constructor(){
        this.page = 1;
        this.limit = 20;
    }
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(TestType),
    _ts_metadata("design:type", String)
], TemplateFiltersDto.prototype, "testType", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    (0, _classtransformer.Type)(()=>Boolean),
    _ts_metadata("design:type", Boolean)
], TemplateFiltersDto.prototype, "isActive", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    _ts_metadata("design:type", Number)
], TemplateFiltersDto.prototype, "page", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(50),
    _ts_metadata("design:type", Number)
], TemplateFiltersDto.prototype, "limit", void 0);

//# sourceMappingURL=index.js.map