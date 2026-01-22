"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CandidateModule", {
    enumerable: true,
    get: function() {
        return CandidateModule;
    }
});
const _common = require("@nestjs/common");
const _candidatecontroller = require("./candidate.controller");
const _candidateservice = require("./candidate.service");
const _cloudinarymodule = require("../cloudinary/cloudinary.module");
const _resumeparsermodule = require("../resume-parser/resume-parser.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let CandidateModule = class CandidateModule {
};
CandidateModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _cloudinarymodule.CloudinaryModule,
            _resumeparsermodule.ResumeParserModule
        ],
        controllers: [
            _candidatecontroller.CandidateController
        ],
        providers: [
            _candidateservice.CandidateService
        ],
        exports: [
            _candidateservice.CandidateService
        ]
    })
], CandidateModule);

//# sourceMappingURL=candidate.module.js.map