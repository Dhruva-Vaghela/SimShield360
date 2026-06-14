// System-wide constants
export const CONSTANTS = {
  // Time constants (in milliseconds)
  TIME: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
  },

  // Request expiration times
  REQUEST: {
    EXPIRY_HOURS: 24,
    EXPIRY_MINUTES: 24 * 60,
  },

  // Verification session times (in minutes)
  VERIFICATION: {
    FACE_SESSION_MINUTES: 10,
    AUTHENTICATOR_SESSION_MINUTES: 5,
    DEVICE_CONSENT_SESSION_MINUTES: 15,
  },

  // Attempt limits
  ATTEMPT: {
    MAX_VERIFICATION_ATTEMPTS: 3,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15,
  },

  // Rate limiting
  RATE_LIMIT: {
    GLOBAL_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    GLOBAL_MAX: 1000,
    AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    AUTH_MAX: 5,
    SWAP_REQUEST_WINDOW_MS: 60 * 60 * 1000, // 1 hour
    SWAP_REQUEST_MAX: 5,
  },

  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_DIGITS: true,
    REQUIRE_SYMBOLS: false,
    HISTORY_COUNT: 5,
  },

  // JWT tokens
  JWT: {
    ACCESS_EXPIRY: '15m',
    REFRESH_EXPIRY: '7d',
    ALGORITHM: 'HS256' as const,
  },

  // Risk scoring thresholds
  RISK: {
    AUTO_APPROVE_THRESHOLD: 30,
    AUTO_DENY_THRESHOLD: 90,
    RISK_LEVELS: {
      LOW: 0,
      MEDIUM: 40,
      HIGH: 60,
      CRITICAL: 80,
    } as const,
    WEIGHTS: {
      deviceTrust: 0.15,
      locationAnomaly: 0.15,
      timeAnomaly: 0.10,
      behaviorScore: 0.20,
      accountAge: 0.10,
      previousSwaps: 0.15,
      telecomIntelligence: 0.15,
    } as const,
  },

  // Face verification
  FACE: {
    MATCH_THRESHOLD: 0.85,
    IMAGE_MIN_SIZE_KB: 10,
    IMAGE_MAX_SIZE_KB: 10000,
    ALLOWED_FORMATS: ['image/jpeg', 'image/png'] as const,
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // Audit log retention (in days)
  AUDIT_LOG_RETENTION_DAYS: 90,

  // Data retention
  DATA_RETENTION: {
    AUDIT_LOGS_DAYS: 90,
    RISK_LOGS_DAYS: 365,
    VERIFICATION_SESSIONS_DAYS: 30,
  },

  // External API timeouts (in milliseconds)
  API_TIMEOUTS: {
    FACE_API: 5000,
    TELECOM_API: 10000,
    EMAIL_API: 10000,
    SMS_API: 15000,
  },

  // Encryption
  ENCRYPTION: {
    ALGORITHM: 'aes-256-gcm' as const,
    KEY_LENGTH: 32,
    IV_LENGTH: 12,
  },

  // Notification priorities
  PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  } as const,

  // Notification types
  NOTIFICATION_TYPES: {
    SWAP_REQUEST_CREATED: 'swap_request_created',
    SWAP_APPROVED: 'swap_approved',
    SWAP_DENIED: 'swap_denied',
    SIM_LOCKED: 'sim_locked',
    SIM_UNLOCKED: 'sim_unlocked',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    DEVICE_TRUSTED: 'device_trusted',
    VERIFICATION_REQUIRED: 'verification_required',
    MANUAL_REVIEW_REQUIRED: 'manual_review_required',
    RISK_ALERT: 'risk_alert',
  } as const,

  // Request types
  REQUEST_TYPES: {
    SIM_SWAP: 'sim_swap',
    ESIM_TRANSFER: 'esim_transfer',
    PORT_OUT: 'port_out',
  } as const,

  // Request statuses
  REQUEST_STATUSES: {
    PENDING: 'pending',
    LAYER1_BLOCKED: 'layer1_blocked',
    LAYER2_PENDING: 'layer2_pending',
    LAYER2_FAILED: 'layer2_failed',
    LAYER3_PENDING: 'layer3_pending',
    LAYER3_FAILED: 'layer3_failed',
    LAYER4_PENDING: 'layer4_pending',
    LAYER4_FAILED: 'layer4_failed',
    LAYER5_PROCESSING: 'layer5_processing',
    LAYER6_PROCESSING: 'layer6_processing',
    LAYER7_PENDING_MANUAL: 'layer7_pending_manual',
    APPROVED: 'approved',
    DENIED: 'denied',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
  } as const,

  // User roles
  ROLES: {
    CUSTOMER: 'customer',
    AGENT: 'agent',
    ADMIN: 'admin',
  } as const,

  // Device types
  DEVICE_TYPES: {
    MOBILE: 'mobile',
    TABLET: 'tablet',
    DESKTOP: 'desktop',
  } as const,

  // Session types
  SESSION_TYPES: {
    FACE: 'face',
    AUTHENTICATOR: 'authenticator',
    DEVICE_CONSENT: 'device_consent',
  } as const,
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_INVALID_OTP: 'AUTH_INVALID_OTP',
  AUTH_OTP_EXPIRED: 'AUTH_OTP_EXPIRED',

  // User errors
  USER_EMAIL_EXISTS: 'USER_EMAIL_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_INVALID_ROLE: 'USER_INVALID_ROLE',

  // SIM lock errors
  SIM_LOCK_ACTIVE: 'SIM_LOCK_ACTIVE',
  SIM_LOCK_NOT_FOUND: 'SIM_LOCK_NOT_FOUND',
  SIM_LOCK_ALREADY_EXISTS: 'SIM_LOCK_ALREADY_EXISTS',

  // Swap request errors
  SWAP_REQUEST_EXISTS: 'SWAP_REQUEST_EXISTS',
  SWAP_REQUEST_NOT_FOUND: 'SWAP_REQUEST_NOT_FOUND',
  SWAP_REQUEST_EXPIRED: 'SWAP_REQUEST_EXPIRED',
  SWAP_REQUEST_INVALID_STATUS: 'SWAP_REQUEST_INVALID_STATUS',
  SWAP_REQUEST_ALREADY_REVIEWED: 'SWAP_REQUEST_ALREADY_REVIEWED',

  // Verification errors
  VERIFICATION_SESSION_EXPIRED: 'VERIFICATION_SESSION_EXPIRED',
  VERIFICATION_SESSION_NOT_FOUND: 'VERIFICATION_SESSION_NOT_FOUND',
  VERIFICATION_MAX_ATTEMPTS: 'VERIFICATION_MAX_ATTEMPTS',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  VERIFICATION_ALREADY_COMPLETED: 'VERIFICATION_ALREADY_COMPLETED',

  // Risk errors
  RISK_ASSESSMENT_NOT_FOUND: 'RISK_ASSESSMENT_NOT_FOUND',

  // Audit errors
  AUDIT_LOG_NOT_FOUND: 'AUDIT_LOG_NOT_FOUND',

  // Notification errors
  NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',

  // Device errors
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  DEVICE_NOT_TRUSTED: 'DEVICE_NOT_TRUSTED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  VALIDATION_SCHEMA_ERROR: 'VALIDATION_SCHEMA_ERROR',

  // Internal errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // HTTP errors
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

// HTTP Status Codes
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Export all constants
export default CONSTANTS;
