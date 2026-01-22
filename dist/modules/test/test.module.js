"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TestModule", {
    enumerable: true,
    get: function() {
        return TestModule;
    }
});
const _common = require("@nestjs/common");
const _testcontroller = require("./test.controller");
const _testservice = require("./test.service");
const _skillbucketmodule = require("../skill-bucket/skill-bucket.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let TestModule = class TestModule {
};
TestModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _skillbucketmodule.SkillBucketModule
        ],
        controllers: [
            _testcontroller.TestController
        ],
        providers: [
            _testservice.TestService
        ],
        exports: [
            _testservice.TestService
        ]
    })
], TestModule);

//# sourceMappingURL=test.module.js.map