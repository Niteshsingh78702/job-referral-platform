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
    get ConfirmInterviewDto () {
        return ConfirmInterviewDto;
    },
    get InterviewMode () {
        return InterviewMode;
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
var InterviewMode = /*#__PURE__*/ function(InterviewMode) {
    InterviewMode["CALL"] = "CALL";
    InterviewMode["VIDEO"] = "VIDEO";
    InterviewMode["ONSITE"] = "ONSITE";
    return InterviewMode;
}({});
let ConfirmInterviewDto = class ConfirmInterviewDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDateString)(),
    _ts_metadata("design:type", String)
], ConfirmInterviewDto.prototype, "scheduledDate", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(50),
    _ts_metadata("design:type", String)
], ConfirmInterviewDto.prototype, "scheduledTime", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(InterviewMode),
    _ts_metadata("design:type", String)
], ConfirmInterviewDto.prototype, "mode", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(1000),
    _ts_metadata("design:type", String)
], ConfirmInterviewDto.prototype, "hrNote", void 0);

//# sourceMappingURL=confirm-interview.dto.js.map