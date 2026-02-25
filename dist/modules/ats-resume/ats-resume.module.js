"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AtsResumeModule", {
    enumerable: true,
    get: function() {
        return AtsResumeModule;
    }
});
const _common = require("@nestjs/common");
const _atsresumecontroller = require("./ats-resume.controller");
const _atsresumeservice = require("./ats-resume.service");
const _resumeparsermodule = require("../resume-parser/resume-parser.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AtsResumeModule = class AtsResumeModule {
};
AtsResumeModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _resumeparsermodule.ResumeParserModule
        ],
        controllers: [
            _atsresumecontroller.AtsResumeController
        ],
        providers: [
            _atsresumeservice.AtsResumeService
        ],
        exports: [
            _atsresumeservice.AtsResumeService
        ]
    })
], AtsResumeModule);

//# sourceMappingURL=ats-resume.module.js.map