"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SkillBucketModule", {
    enumerable: true,
    get: function() {
        return SkillBucketModule;
    }
});
const _common = require("@nestjs/common");
const _skillbucketcontroller = require("./skill-bucket.controller");
const _skillbucketservice = require("./skill-bucket.service");
const _prismamodule = require("../../prisma/prisma.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let SkillBucketModule = class SkillBucketModule {
};
SkillBucketModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _prismamodule.PrismaModule
        ],
        controllers: [
            _skillbucketcontroller.SkillBucketController
        ],
        providers: [
            _skillbucketservice.SkillBucketService
        ],
        exports: [
            _skillbucketservice.SkillBucketService
        ]
    })
], SkillBucketModule);

//# sourceMappingURL=skill-bucket.module.js.map