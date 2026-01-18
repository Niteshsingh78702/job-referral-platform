"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InterviewModule", {
    enumerable: true,
    get: function() {
        return InterviewModule;
    }
});
const _common = require("@nestjs/common");
const _interviewcontroller = require("./interview.controller");
const _interviewservice = require("./interview.service");
const _emailmodule = require("../email/email.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let InterviewModule = class InterviewModule {
};
InterviewModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _emailmodule.EmailModule
        ],
        controllers: [
            _interviewcontroller.InterviewController
        ],
        providers: [
            _interviewservice.InterviewService
        ],
        exports: [
            _interviewservice.InterviewService
        ]
    })
], InterviewModule);

//# sourceMappingURL=interview.module.js.map