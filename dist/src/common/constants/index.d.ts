export declare enum UserRole {
    CANDIDATE = "CANDIDATE",
    HR = "HR",
    EMPLOYEE = "EMPLOYEE",
    ADMIN = "ADMIN"
}
export declare enum UserStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    BLOCKED = "BLOCKED",
    DELETED = "DELETED"
}
export declare enum JobStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    CLOSED = "CLOSED"
}
export declare enum ApplicationStatus {
    APPLIED = "APPLIED",
    TEST_PENDING = "TEST_PENDING",
    TEST_PASSED = "TEST_PASSED",
    TEST_FAILED = "TEST_FAILED",
    REFERRAL_PENDING = "REFERRAL_PENDING",
    REFERRAL_CONFIRMED = "REFERRAL_CONFIRMED",
    PAYMENT_PENDING = "PAYMENT_PENDING",
    CONTACT_UNLOCKED = "CONTACT_UNLOCKED",
    CLOSED = "CLOSED",
    EXPIRED = "EXPIRED"
}
export declare enum TestSessionStatus {
    ACTIVE = "ACTIVE",
    SUBMITTED = "SUBMITTED",
    AUTO_SUBMITTED = "AUTO_SUBMITTED",
    EXPIRED = "EXPIRED"
}
export declare enum ReferralStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    PAYMENT_PENDING = "PAYMENT_PENDING",
    CONTACTED = "CONTACTED",
    CLOSED = "CLOSED",
    EXPIRED = "EXPIRED"
}
export declare enum ReferralType {
    EMPLOYEE = "EMPLOYEE",
    HR_DIRECT = "HR_DIRECT"
}
export declare enum PaymentStatus {
    ELIGIBLE = "ELIGIBLE",
    ORDER_CREATED = "ORDER_CREATED",
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare enum RefundStatus {
    REQUESTED = "REQUESTED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    PROCESSED = "PROCESSED"
}
export declare enum HRApprovalStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum NotificationType {
    EMAIL = "EMAIL",
    SMS = "SMS",
    PUSH = "PUSH"
}
export declare enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    TEST_START = "TEST_START",
    TEST_SUBMIT = "TEST_SUBMIT",
    TEST_TAB_SWITCH = "TEST_TAB_SWITCH",
    PAYMENT_INITIATED = "PAYMENT_INITIATED",
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
    PAYMENT_FAILED = "PAYMENT_FAILED",
    REFUND_REQUESTED = "REFUND_REQUESTED",
    REFUND_PROCESSED = "REFUND_PROCESSED",
    ADMIN_OVERRIDE = "ADMIN_OVERRIDE"
}
export declare enum EarningStatus {
    PENDING = "PENDING",
    ELIGIBLE = "ELIGIBLE",
    PROCESSING = "PROCESSING",
    PAID = "PAID",
    CANCELLED = "CANCELLED"
}
export declare const JWT_CONSTANTS: {
    ACCESS_TOKEN_COOKIE: string;
    REFRESH_TOKEN_COOKIE: string;
};
export declare const REDIS_KEYS: {
    TEST_SESSION: (sessionId: string) => string;
    OTP: (userId: string, type: string) => string;
    RATE_LIMIT: (key: string) => string;
    USER_SESSION: (userId: string) => string;
};
export declare const PAGINATION: {
    DEFAULT_PAGE: number;
    DEFAULT_LIMIT: number;
    MAX_LIMIT: number;
};
