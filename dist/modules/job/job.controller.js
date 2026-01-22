"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "JobController", {
    enumerable: true,
    get: function() {
        return JobController;
    }
});
const _common = require("@nestjs/common");
const _jobservice = require("./job.service");
const _dto = require("./dto");
const _decorators = require("../../common/decorators");
const _constants = require("../../common/constants");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let JobController = class JobController {
    async getActiveJobs(query) {
        return this.jobService.getActiveJobs(query);
    }
    async getJob(idOrSlug) {
        return this.jobService.getJobById(idOrSlug);
    }
    async createJob(userId, dto) {
        return this.jobService.createJob(userId, dto);
    }
    async updateJob(jobId, userId, dto) {
        return this.jobService.updateJob(jobId, userId, dto);
    }
    async getApplyEligibility(jobId, userId) {
        return this.jobService.getApplyEligibility(jobId, userId);
    }
    async applyForJob(jobId, userId, dto) {
        return this.jobService.applyForJob(jobId, userId, dto);
    }
    async getMyJobs(userId, status) {
        return this.jobService.getHRJobs(userId, status);
    }
    constructor(jobService){
        this.jobService = jobService;
    }
};
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Get)(),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.JobQueryDto === "undefined" ? Object : _dto.JobQueryDto
    ]),
    _ts_metadata("design:returntype", Promise)
], JobController.prototype, "getActiveJobs", null);
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Get)(':idOrSlug'),
    _ts_param(0, (0, _common.Param)('idOrSlug')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], JobController.prototype, "getJob", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _decorators.Roles)(_constants.UserRole.HR, _constants.UserRole.ADMIN),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.CreateJobDto === "undefined" ? Object : _dto.CreateJobDto
    ]),
    _ts_metadata("design:returntype", Promise)
], JobController.prototype, "createJob", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _decorators.Roles)(_constants.UserRole.HR, _constants.UserRole.ADMIN),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _dto.UpdateJobDto === "undefined" ? Object : _dto.UpdateJobDto
    ]),
    _ts_metadata("design:returntype", Promise)
], JobController.prototype, "updateJob", null);
_ts_decorate([
    (0, _common.Get)(':id/apply-eligibility'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], JobController.prototype, "getApplyEligibility", null);
_ts_decorate([
    (0, _common.Post)(':id/apply'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _dto.ApplyJobDto === "undefined" ? Object : _dto.ApplyJobDto
    ]),
    _ts_metadata("design:returntype", Promise)
], JobController.prototype, "applyForJob", null);
_ts_decorate([
    (0, _common.Get)('hr/my-jobs'),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], JobController.prototype, "getMyJobs", null);
JobController = _ts_decorate([
    (0, _common.Controller)('jobs'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _jobservice.JobService === "undefined" ? Object : _jobservice.JobService
    ])
], JobController);

//# sourceMappingURL=job.controller.js.map