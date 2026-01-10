"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGINATION = exports.REDIS_KEYS = exports.JWT_CONSTANTS = exports.EarningStatus = exports.AuditAction = exports.NotificationType = exports.HRApprovalStatus = exports.RefundStatus = exports.PaymentStatus = exports.ReferralType = exports.ReferralStatus = exports.TestSessionStatus = exports.ApplicationStatus = exports.JobStatus = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["CANDIDATE"] = "CANDIDATE";
    UserRole["HR"] = "HR";
    UserRole["EMPLOYEE"] = "EMPLOYEE";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING"] = "PENDING";
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["BLOCKED"] = "BLOCKED";
    UserStatus["DELETED"] = "DELETED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["DRAFT"] = "DRAFT";
    JobStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    JobStatus["ACTIVE"] = "ACTIVE";
    JobStatus["EXPIRED"] = "EXPIRED";
    JobStatus["CLOSED"] = "CLOSED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["APPLIED"] = "APPLIED";
    ApplicationStatus["TEST_PENDING"] = "TEST_PENDING";
    ApplicationStatus["TEST_PASSED"] = "TEST_PASSED";
    ApplicationStatus["TEST_FAILED"] = "TEST_FAILED";
    ApplicationStatus["REFERRAL_PENDING"] = "REFERRAL_PENDING";
    ApplicationStatus["REFERRAL_CONFIRMED"] = "REFERRAL_CONFIRMED";
    ApplicationStatus["PAYMENT_PENDING"] = "PAYMENT_PENDING";
    ApplicationStatus["CONTACT_UNLOCKED"] = "CONTACT_UNLOCKED";
    ApplicationStatus["CLOSED"] = "CLOSED";
    ApplicationStatus["EXPIRED"] = "EXPIRED";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
var TestSessionStatus;
(function (TestSessionStatus) {
    TestSessionStatus["ACTIVE"] = "ACTIVE";
    TestSessionStatus["SUBMITTED"] = "SUBMITTED";
    TestSessionStatus["AUTO_SUBMITTED"] = "AUTO_SUBMITTED";
    TestSessionStatus["EXPIRED"] = "EXPIRED";
})(TestSessionStatus || (exports.TestSessionStatus = TestSessionStatus = {}));
var ReferralStatus;
(function (ReferralStatus) {
    ReferralStatus["PENDING"] = "PENDING";
    ReferralStatus["CONFIRMED"] = "CONFIRMED";
    ReferralStatus["PAYMENT_PENDING"] = "PAYMENT_PENDING";
    ReferralStatus["CONTACTED"] = "CONTACTED";
    ReferralStatus["CLOSED"] = "CLOSED";
    ReferralStatus["EXPIRED"] = "EXPIRED";
})(ReferralStatus || (exports.ReferralStatus = ReferralStatus = {}));
var ReferralType;
(function (ReferralType) {
    ReferralType["EMPLOYEE"] = "EMPLOYEE";
    ReferralType["HR_DIRECT"] = "HR_DIRECT";
})(ReferralType || (exports.ReferralType = ReferralType = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["ELIGIBLE"] = "ELIGIBLE";
    PaymentStatus["ORDER_CREATED"] = "ORDER_CREATED";
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["SUCCESS"] = "SUCCESS";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var RefundStatus;
(function (RefundStatus) {
    RefundStatus["REQUESTED"] = "REQUESTED";
    RefundStatus["APPROVED"] = "APPROVED";
    RefundStatus["REJECTED"] = "REJECTED";
    RefundStatus["PROCESSED"] = "PROCESSED";
})(RefundStatus || (exports.RefundStatus = RefundStatus = {}));
var HRApprovalStatus;
(function (HRApprovalStatus) {
    HRApprovalStatus["PENDING"] = "PENDING";
    HRApprovalStatus["APPROVED"] = "APPROVED";
    HRApprovalStatus["REJECTED"] = "REJECTED";
})(HRApprovalStatus || (exports.HRApprovalStatus = HRApprovalStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["EMAIL"] = "EMAIL";
    NotificationType["SMS"] = "SMS";
    NotificationType["PUSH"] = "PUSH";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "CREATE";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["TEST_START"] = "TEST_START";
    AuditAction["TEST_SUBMIT"] = "TEST_SUBMIT";
    AuditAction["TEST_TAB_SWITCH"] = "TEST_TAB_SWITCH";
    AuditAction["PAYMENT_INITIATED"] = "PAYMENT_INITIATED";
    AuditAction["PAYMENT_SUCCESS"] = "PAYMENT_SUCCESS";
    AuditAction["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    AuditAction["REFUND_REQUESTED"] = "REFUND_REQUESTED";
    AuditAction["REFUND_PROCESSED"] = "REFUND_PROCESSED";
    AuditAction["ADMIN_OVERRIDE"] = "ADMIN_OVERRIDE";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var EarningStatus;
(function (EarningStatus) {
    EarningStatus["PENDING"] = "PENDING";
    EarningStatus["ELIGIBLE"] = "ELIGIBLE";
    EarningStatus["PROCESSING"] = "PROCESSING";
    EarningStatus["PAID"] = "PAID";
    EarningStatus["CANCELLED"] = "CANCELLED";
})(EarningStatus || (exports.EarningStatus = EarningStatus = {}));
exports.JWT_CONSTANTS = {
    ACCESS_TOKEN_COOKIE: 'access_token',
    REFRESH_TOKEN_COOKIE: 'refresh_token',
};
exports.REDIS_KEYS = {
    TEST_SESSION: (sessionId) => `test:session:${sessionId}`,
    OTP: (userId, type) => `otp:${type}:${userId}`,
    RATE_LIMIT: (key) => `rate:${key}`,
    USER_SESSION: (userId) => `user:session:${userId}`,
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
};
//# sourceMappingURL=index.js.map