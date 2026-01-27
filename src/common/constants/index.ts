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
  TEST_PENDING = 'TEST_PENDING', // Legacy - for existing records
  TEST_REQUIRED = 'TEST_REQUIRED',
  TEST_IN_PROGRESS = 'TEST_IN_PROGRESS',
  TEST_FAILED = 'TEST_FAILED',
  TEST_PASSED_WAITING_HR = 'TEST_PASSED_WAITING_HR', // Passed test, waiting for HR review
  APPLIED = 'APPLIED',
  INTERVIEW_CONFIRMED = 'INTERVIEW_CONFIRMED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  INTERVIEW_COMPLETED = 'INTERVIEW_COMPLETED',
  SELECTED = 'SELECTED', // Candidate selected after interview
  INTERVIEW_REJECTED = 'INTERVIEW_REJECTED', // Candidate not selected after interview
  CANDIDATE_NO_SHOW = 'CANDIDATE_NO_SHOW',
  HR_NO_SHOW = 'HR_NO_SHOW',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED', // Test expired
}

export enum CandidateTestAttemptStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
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
  INTERVIEW_CONFIRMED = 'INTERVIEW_CONFIRMED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  INTERVIEW_COMPLETED = 'INTERVIEW_COMPLETED',
  CANDIDATE_NO_SHOW = 'CANDIDATE_NO_SHOW',
  HR_NO_SHOW = 'HR_NO_SHOW',
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
