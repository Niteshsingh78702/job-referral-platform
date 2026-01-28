// ===========================================
// User Roles
// ===========================================
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
    get ApplicationStatus () {
        return ApplicationStatus;
    },
    get AuditAction () {
        return AuditAction;
    },
    get CandidateTestAttemptStatus () {
        return CandidateTestAttemptStatus;
    },
    get EarningStatus () {
        return EarningStatus;
    },
    get HRApprovalStatus () {
        return HRApprovalStatus;
    },
    get InterviewMode () {
        return InterviewMode;
    },
    get InterviewStatus () {
        return InterviewStatus;
    },
    get JWT_CONSTANTS () {
        return JWT_CONSTANTS;
    },
    get JobStatus () {
        return JobStatus;
    },
    get NotificationType () {
        return NotificationType;
    },
    get PAGINATION () {
        return PAGINATION;
    },
    get PaymentStatus () {
        return PaymentStatus;
    },
    get REDIS_KEYS () {
        return REDIS_KEYS;
    },
    get ReferralStatus () {
        return ReferralStatus;
    },
    get ReferralType () {
        return ReferralType;
    },
    get RefundStatus () {
        return RefundStatus;
    },
    get TestSessionStatus () {
        return TestSessionStatus;
    },
    get UserRole () {
        return UserRole;
    },
    get UserStatus () {
        return UserStatus;
    }
});
var UserRole = /*#__PURE__*/ function(UserRole) {
    UserRole["CANDIDATE"] = "CANDIDATE";
    UserRole["HR"] = "HR";
    UserRole["EMPLOYEE"] = "EMPLOYEE";
    UserRole["ADMIN"] = "ADMIN";
    return UserRole;
}({});
var UserStatus = /*#__PURE__*/ function(UserStatus) {
    UserStatus["PENDING"] = "PENDING";
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["BLOCKED"] = "BLOCKED";
    UserStatus["DELETED"] = "DELETED";
    return UserStatus;
}({});
var JobStatus = /*#__PURE__*/ function(JobStatus) {
    JobStatus["DRAFT"] = "DRAFT";
    JobStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    JobStatus["ACTIVE"] = "ACTIVE";
    JobStatus["EXPIRED"] = "EXPIRED";
    JobStatus["CLOSED"] = "CLOSED";
    return JobStatus;
}({});
var ApplicationStatus = /*#__PURE__*/ function(ApplicationStatus) {
    ApplicationStatus["TEST_PENDING"] = "TEST_PENDING";
    ApplicationStatus["TEST_REQUIRED"] = "TEST_REQUIRED";
    ApplicationStatus["TEST_IN_PROGRESS"] = "TEST_IN_PROGRESS";
    ApplicationStatus["TEST_FAILED"] = "TEST_FAILED";
    ApplicationStatus["TEST_PASSED_WAITING_HR"] = "TEST_PASSED_WAITING_HR";
    ApplicationStatus["APPLIED"] = "APPLIED";
    ApplicationStatus["INTERVIEW_CONFIRMED"] = "INTERVIEW_CONFIRMED";
    ApplicationStatus["PAYMENT_PENDING"] = "PAYMENT_PENDING";
    ApplicationStatus["PAYMENT_SUCCESS"] = "PAYMENT_SUCCESS";
    ApplicationStatus["INTERVIEW_COMPLETED"] = "INTERVIEW_COMPLETED";
    ApplicationStatus["SELECTED"] = "SELECTED";
    ApplicationStatus["INTERVIEW_REJECTED"] = "INTERVIEW_REJECTED";
    ApplicationStatus["CANDIDATE_NO_SHOW"] = "CANDIDATE_NO_SHOW";
    ApplicationStatus["HR_NO_SHOW"] = "HR_NO_SHOW";
    ApplicationStatus["REJECTED"] = "REJECTED";
    ApplicationStatus["EXPIRED"] = "EXPIRED";
    ApplicationStatus["WITHDRAWN"] = "WITHDRAWN";
    return ApplicationStatus;
}({});
var CandidateTestAttemptStatus = /*#__PURE__*/ function(CandidateTestAttemptStatus) {
    CandidateTestAttemptStatus["NOT_STARTED"] = "NOT_STARTED";
    CandidateTestAttemptStatus["IN_PROGRESS"] = "IN_PROGRESS";
    CandidateTestAttemptStatus["PASSED"] = "PASSED";
    CandidateTestAttemptStatus["FAILED"] = "FAILED";
    CandidateTestAttemptStatus["EXPIRED"] = "EXPIRED";
    return CandidateTestAttemptStatus;
}({});
var TestSessionStatus = /*#__PURE__*/ function(TestSessionStatus) {
    TestSessionStatus["ACTIVE"] = "ACTIVE";
    TestSessionStatus["SUBMITTED"] = "SUBMITTED";
    TestSessionStatus["AUTO_SUBMITTED"] = "AUTO_SUBMITTED";
    TestSessionStatus["EXPIRED"] = "EXPIRED";
    return TestSessionStatus;
}({});
var ReferralStatus = /*#__PURE__*/ function(ReferralStatus) {
    ReferralStatus["PENDING"] = "PENDING";
    ReferralStatus["CONFIRMED"] = "CONFIRMED";
    ReferralStatus["PAYMENT_PENDING"] = "PAYMENT_PENDING";
    ReferralStatus["CONTACTED"] = "CONTACTED";
    ReferralStatus["CLOSED"] = "CLOSED";
    ReferralStatus["EXPIRED"] = "EXPIRED";
    return ReferralStatus;
}({});
var ReferralType = /*#__PURE__*/ function(ReferralType) {
    ReferralType["EMPLOYEE"] = "EMPLOYEE";
    ReferralType["HR_DIRECT"] = "HR_DIRECT";
    return ReferralType;
}({});
var PaymentStatus = /*#__PURE__*/ function(PaymentStatus) {
    PaymentStatus["ELIGIBLE"] = "ELIGIBLE";
    PaymentStatus["ORDER_CREATED"] = "ORDER_CREATED";
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["SUCCESS"] = "SUCCESS";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    return PaymentStatus;
}({});
var RefundStatus = /*#__PURE__*/ function(RefundStatus) {
    RefundStatus["REQUESTED"] = "REQUESTED";
    RefundStatus["APPROVED"] = "APPROVED";
    RefundStatus["REJECTED"] = "REJECTED";
    RefundStatus["PROCESSED"] = "PROCESSED";
    return RefundStatus;
}({});
var HRApprovalStatus = /*#__PURE__*/ function(HRApprovalStatus) {
    HRApprovalStatus["PENDING"] = "PENDING";
    HRApprovalStatus["APPROVED"] = "APPROVED";
    HRApprovalStatus["REJECTED"] = "REJECTED";
    return HRApprovalStatus;
}({});
var NotificationType = /*#__PURE__*/ function(NotificationType) {
    NotificationType["EMAIL"] = "EMAIL";
    NotificationType["SMS"] = "SMS";
    NotificationType["PUSH"] = "PUSH";
    return NotificationType;
}({});
var AuditAction = /*#__PURE__*/ function(AuditAction) {
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
    return AuditAction;
}({});
var EarningStatus = /*#__PURE__*/ function(EarningStatus) {
    EarningStatus["PENDING"] = "PENDING";
    EarningStatus["ELIGIBLE"] = "ELIGIBLE";
    EarningStatus["PROCESSING"] = "PROCESSING";
    EarningStatus["PAID"] = "PAID";
    EarningStatus["CANCELLED"] = "CANCELLED";
    return EarningStatus;
}({});
var InterviewStatus = /*#__PURE__*/ function(InterviewStatus) {
    InterviewStatus["INTERVIEW_CONFIRMED"] = "INTERVIEW_CONFIRMED";
    InterviewStatus["PAYMENT_PENDING"] = "PAYMENT_PENDING";
    InterviewStatus["PAYMENT_SUCCESS"] = "PAYMENT_SUCCESS";
    InterviewStatus["INTERVIEW_COMPLETED"] = "INTERVIEW_COMPLETED";
    InterviewStatus["CANDIDATE_NO_SHOW"] = "CANDIDATE_NO_SHOW";
    InterviewStatus["HR_NO_SHOW"] = "HR_NO_SHOW";
    InterviewStatus["CANCELLED"] = "CANCELLED";
    return InterviewStatus;
}({});
var InterviewMode = /*#__PURE__*/ function(InterviewMode) {
    InterviewMode["CALL"] = "CALL";
    InterviewMode["VIDEO"] = "VIDEO";
    InterviewMode["ONSITE"] = "ONSITE";
    return InterviewMode;
}({});
const JWT_CONSTANTS = {
    ACCESS_TOKEN_COOKIE: 'access_token',
    REFRESH_TOKEN_COOKIE: 'refresh_token'
};
const REDIS_KEYS = {
    TEST_SESSION: (sessionId)=>`test:session:${sessionId}`,
    OTP: (userId, type)=>`otp:${type}:${userId}`,
    RATE_LIMIT: (key)=>`rate:${key}`,
    USER_SESSION: (userId)=>`user:session:${userId}`
};
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

//# sourceMappingURL=index.js.map