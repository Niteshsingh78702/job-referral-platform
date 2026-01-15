// ===========================================
// User Roles
// ===========================================
export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  HR = 'HR',
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN',
}

// ===========================================
// Status Enums
// ===========================================
export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CLOSED = 'CLOSED',
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  TEST_PENDING = 'TEST_PENDING',
  TEST_PASSED = 'TEST_PASSED',
  TEST_FAILED = 'TEST_FAILED',
  REFERRAL_PENDING = 'REFERRAL_PENDING',
  REFERRAL_CONFIRMED = 'REFERRAL_CONFIRMED',
  INTERVIEW_REQUESTED = 'INTERVIEW_REQUESTED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONTACT_UNLOCKED = 'CONTACT_UNLOCKED',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
}

export enum TestSessionStatus {
  ACTIVE = 'ACTIVE',
  SUBMITTED = 'SUBMITTED',
  AUTO_SUBMITTED = 'AUTO_SUBMITTED',
  EXPIRED = 'EXPIRED',
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONTACTED = 'CONTACTED',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
}

export enum ReferralType {
  EMPLOYEE = 'EMPLOYEE',
  HR_DIRECT = 'HR_DIRECT',
}

export enum PaymentStatus {
  ELIGIBLE = 'ELIGIBLE',
  ORDER_CREATED = 'ORDER_CREATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED',
}

export enum HRApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  TEST_START = 'TEST_START',
  TEST_SUBMIT = 'TEST_SUBMIT',
  TEST_TAB_SWITCH = 'TEST_TAB_SWITCH',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  ADMIN_OVERRIDE = 'ADMIN_OVERRIDE',
}

export enum EarningStatus {
  PENDING = 'PENDING',
  ELIGIBLE = 'ELIGIBLE',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum InterviewStatus {
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  READY_TO_SCHEDULE = 'READY_TO_SCHEDULE',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum InterviewMode {
  CALL = 'CALL',
  VIDEO = 'VIDEO',
  ONSITE = 'ONSITE',
}

// ===========================================
// Constants
// ===========================================
export const JWT_CONSTANTS = {
  ACCESS_TOKEN_COOKIE: 'access_token',
  REFRESH_TOKEN_COOKIE: 'refresh_token',
};

export const REDIS_KEYS = {
  TEST_SESSION: (sessionId: string) => `test:session:${sessionId}`,
  OTP: (userId: string, type: string) => `otp:${type}:${userId}`,
  RATE_LIMIT: (key: string) => `rate:${key}`,
  USER_SESSION: (userId: string) => `user:session:${userId}`,
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};
