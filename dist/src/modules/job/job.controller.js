"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobController = void 0;
const common_1 = require("@nestjs/common");
const job_service_1 = require("./job.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const constants_1 = require("../../common/constants");
let JobController = class JobController {
    jobService;
    constructor(jobService) {
        this.jobService = jobService;
    }
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
    async applyForJob(jobId, userId, dto) {
        return this.jobService.applyForJob(jobId, userId, dto);
    }
    async getMyJobs(userId, status) {
        return this.jobService.getHRJobs(userId, status);
    }
};
exports.JobController = JobController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.JobQueryDto]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "getActiveJobs", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(':idOrSlug'),
    __param(0, (0, common_1.Param)('idOrSlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "getJob", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)(constants_1.UserRole.HR, constants_1.UserRole.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateJobDto]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "createJob", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.Roles)(constants_1.UserRole.HR, constants_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateJobDto]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "updateJob", null);
__decorate([
    (0, common_1.Post)(':id/apply'),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.ApplyJobDto]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "applyForJob", null);
__decorate([
    (0, common_1.Get)('hr/my-jobs'),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "getMyJobs", null);
exports.JobController = JobController = __decorate([
    (0, common_1.Controller)('jobs'),
    __metadata("design:paramtypes", [job_service_1.JobService])
], JobController);
//# sourceMappingURL=job.controller.js.map