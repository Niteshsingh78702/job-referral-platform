"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "JobModule", {
    enumerable: true,
    get: function() {
        return JobModule;
    }
});
const _common = require("@nestjs/common");
const _jobcontroller = require("./job.controller");
const _jobservice = require("./job.service");
const _skillbucketmodule = require("../skill-bucket/skill-bucket.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let JobModule = class JobModule {
};
JobModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _skillbucketmodule.SkillBucketModule
        ],
        controllers: [
            _jobcontroller.JobController
        ],
        providers: [
            _jobservice.JobService
        ],
        exports: [
            _jobservice.JobService
        ]
    })
], JobModule);

//# sourceMappingURL=job.module.js.map