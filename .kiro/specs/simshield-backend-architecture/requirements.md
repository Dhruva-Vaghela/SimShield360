# Requirements Document: SIMShield 360 Backend Architecture

## 1. System Overview

### 1.1 Purpose
The SIMShield 360 backend system shall provide a secure, scalable RESTful API that processes SIM swap, eSIM transfer, and port-out requests through a 7-layer authorization firewall to prevent telecom fraud.

### 1.2 Scope
The backend system encompasses authentication services, multi-layer security verification, risk assessment engines, role-based access control, audit logging, and notification services for both Customer and Telecom Agent user roles.

### 1.3 Tech Stack
- Runtime: Node.js (v18.0.0 or higher)
- Framework: Express.js (v4.18.0 or higher)
- Database: MongoDB Atlas (M10+ cluster for production)
- Authentication: JSON Web Tokens (JWT)
- Language: TypeScript (v5.3.0 or higher)

## 2. Functional Requirements

### 2.1 User Management

#### 2.1.1 User Registration
**REQ-USER-001**: The system shall allow users to register with email, password, and profile information (first name, last name, phone number).

**REQ-USER-002**: The system shall enforce password complexity requirements: minimum 8 characters with a mix of uppercase, lowercase, digits, and symbols.

**REQ-USER-003**: The system shall hash all passwords using bcrypt with 12 salt rounds before storage.

**REQ-USER-004**: The system shall assign a role to each user: 'customer' or 'agent'.

**REQ-USER-005**: The system shall send a verification email upon successful registration.

#### 2.1.2 User Authentication
**REQ-AUTH-001**: The system shall authenticate users via email and password credentials.

**REQ-AUTH-002**: The system shall generate a JWT access token (15-minute expiration) and refresh token (7-day expiration) upon successful authentication.

**REQ-AUTH-003**: The system shall implement account lockout after 5 consecutive failed login attempts for 15 minutes.

**REQ-AUTH-004**: The system shall allow users to refresh expired access tokens using valid refresh tokens.

**REQ-AUTH-005**: The system shall implement token rotation, issuing new refresh tokens on each refresh request.

**REQ-AUTH-006**: The system shall provide logout functionality that invalidates the user's refresh token.

#### 2.1.3 Password Management
**REQ-PWD-001**: The system shall provide a forgot password flow that sends a secure reset token via email.

**REQ-PWD-002**: The system shall allow password reset using a valid reset token within 1 hour of issuance.

**REQ-PWD-003**: The system shall prevent reuse of the last 5 passwords.

**REQ-PWD-004**: The system shall invalidate all existing sessions when a user resets their password.

#### 2.1.4 Authenticator Setup (TOTP)
**REQ-TOTP-001**: The system shall allow users to set up Time-based One-Time Password (TOTP) authenticators.

**REQ-TOTP-002**: The system shall generate a secret key and QR code for authenticator apps (Google Authenticator, Authy, etc.).

**REQ-TOTP-003**: The system shall require verification of a TOTP code before enabling the authenticator.

**REQ-TOTP-004**: The system shall generate 10 backup codes when authenticator is enabled.

**REQ-TOTP-005**: The system shall allow users to disable their authenticator.

### 2.2 SIM Lock Management

#### 2.2.1 SIM Lock Operations
**REQ-LOCK-001**: The system shall allow customers to create a SIM lock for their SIM card using ICCID.

**REQ-LOCK-002**: The system shall enforce one active SIM lock per user at any time.

**REQ-LOCK-003**: The system shall allow users to enable (lock) and disable (unlock) their SIM lock.

**REQ-LOCK-004**: The system shall record lock type ('user_initiated' or 'system_initiated') and timestamps for all lock operations.

**REQ-LOCK-005**: The system shall provide SIM lock history showing all lock/unlock events.

**REQ-LOCK-006**: The system shall prevent SIM swap requests when an active SIM lock exists.

### 2.3 SIM Swap Request Workflow

#### 2.3.1 Request Initiation
**REQ-SWAP-001**: The system shall allow customers to create SIM swap requests of type: 'sim_swap', 'esim_transfer', or 'port_out'.

**REQ-SWAP-002**: The system shall generate a unique request ID (UUID v4) for each swap request.

**REQ-SWAP-003**: The system shall capture device fingerprint, IP address, and geolocation data for all requests.

**REQ-SWAP-004**: The system shall set request expiration to 24 hours from creation time.

**REQ-SWAP-005**: The system shall prevent users from having more than one pending or approved swap request within 24 hours.

#### 2.3.2 Layer 1: SIM Lock Firewall
**REQ-L1-001**: The system shall check for active SIM locks before processing any swap request.

**REQ-L1-002**: The system shall immediately block and deny requests if an active SIM lock is detected.

**REQ-L1-003**: The system shall record Layer 1 results with timestamp and blocking reason.

**REQ-L1-004**: The system shall notify users when their request is blocked by SIM lock.

**REQ-L1-005**: The system shall transition to Layer 2 if no active SIM lock exists.

#### 2.3.3 Layer 2: Face Verification
**REQ-L2-001**: The system shall create a face verification session with 10-minute expiration when Layer 2 is reached.

**REQ-L2-002**: The system shall allow up to 3 face verification attempts per session.

**REQ-L2-003**: The system shall accept face images in JPEG or PNG format between 10KB and 10MB.

**REQ-L2-004**: The system shall extract face encoding from submitted images and compare with stored face profile.

**REQ-L2-005**: The system shall require a minimum 85% face match score for successful verification.

**REQ-L2-006**: The system shall fail the request if max attempts are exceeded or match score is below threshold.

**REQ-L2-007**: The system shall record face match score and timestamp in Layer 2 results.

**REQ-L2-008**: The system shall transition to Layer 3 upon successful face verification.

#### 2.3.4 Layer 3: Authenticator Verification
**REQ-L3-001**: The system shall create an authenticator verification session with 5-minute expiration when Layer 3 is reached.

**REQ-L3-002**: The system shall allow up to 3 authenticator code attempts per session.

**REQ-L3-003**: The system shall accept 6-digit TOTP codes for verification.

**REQ-L3-004**: The system shall verify TOTP codes against the user's stored authenticator secret.

**REQ-L3-005**: The system shall skip Layer 3 if the user has not enabled authenticator.

**REQ-L3-006**: The system shall fail the request if max attempts are exceeded or code is invalid.

**REQ-L3-007**: The system shall transition to Layer 4 upon successful authenticator verification (or if skipped).

#### 2.3.5 Layer 4: Trusted Device Consent
**REQ-L4-001**: The system shall check if the request device fingerprint matches a trusted device.

**REQ-L4-002**: The system shall automatically proceed to Layer 5 if device is already trusted.

**REQ-L4-003**: The system shall create a device consent session with 15-minute expiration for new devices.

**REQ-L4-004**: The system shall require explicit user consent before trusting a new device.

**REQ-L4-005**: The system shall register and trust the device upon user consent.

**REQ-L4-006**: The system shall capture device metadata (name, type, browser, OS) during registration.

**REQ-L4-007**: The system shall transition to Layer 5 after device trust is established.

#### 2.3.6 Layer 5: Telecom Intelligence
**REQ-L5-001**: The system shall gather telecom intelligence data including account age, previous swap count, and recent activity.

**REQ-L5-002**: The system shall analyze previous swaps within the last 90 days.

**REQ-L5-003**: The system shall check for suspicious patterns in user behavior.

**REQ-L5-004**: The system shall retrieve carrier history from the user's MSISDN.

**REQ-L5-005**: The system shall store intelligence data in Layer 5 results.

**REQ-L5-006**: The system shall automatically transition to Layer 6 after intelligence gathering.

#### 2.3.7 Layer 6: Risk Scoring Engine
**REQ-L6-001**: The system shall calculate risk scores based on 7 risk factors: device trust, location anomaly, time anomaly, behavior score, account age, previous swaps, and telecom intelligence.

**REQ-L6-002**: The system shall use weighted aggregation with specific weights for each risk factor.

**REQ-L6-003**: The system shall ensure all risk scores are between 0 and 100.

**REQ-L6-004**: The system shall map risk scores to risk levels: critical (>=80), high (>=60), medium (>=40), low (<40).

**REQ-L6-005**: The system shall create a RiskLog entry for each risk assessment.

**REQ-L6-006**: The system shall generate recommendations based on risk factors.

**REQ-L6-007**: The system shall transition to Layer 7 after risk scoring is complete.

#### 2.3.8 Layer 7: Decision Engine
**REQ-L7-001**: The system shall auto-approve requests with risk scores below 30.

**REQ-L7-002**: The system shall auto-deny requests with risk scores of 90 or above.

**REQ-L7-003**: The system shall route requests with risk scores between 30 and 89 to manual agent review.

**REQ-L7-004**: The system shall notify all available agents when a request requires manual review.

**REQ-L7-005**: The system shall record the decision type (auto-approved, auto-denied, or pending manual review) in Layer 7 results.

**REQ-L7-006**: The system shall update request status to 'approved', 'denied', or 'layer7_pending_manual' based on decision.

**REQ-L7-007**: The system shall notify customers of final decisions (approved or denied).

#### 2.3.9 Request Management
**REQ-SWAP-006**: The system shall allow customers to view all their swap requests with status and timestamps.

**REQ-SWAP-007**: The system shall allow customers to cancel pending requests before final decision.

**REQ-SWAP-008**: The system shall mark requests as 'expired' if not completed within 24 hours.

**REQ-SWAP-009**: The system shall provide detailed request information including layer results and risk assessment.

**REQ-SWAP-010**: The system shall allow agents to view all pending requests requiring manual review.

**REQ-SWAP-011**: The system shall allow agents to approve or deny requests with mandatory comments.

**REQ-SWAP-012**: The system shall record agent ID and timestamp for all manual reviews.

### 2.4 Device Management

**REQ-DEV-001**: The system shall allow customers to view all their trusted devices.

**REQ-DEV-002**: The system shall display device metadata (name, type, browser, OS, last used timestamp) for each device.

**REQ-DEV-003**: The system shall allow customers to remove trusted devices.

**REQ-DEV-004**: The system shall generate unique device fingerprints based on browser and device characteristics.

**REQ-DEV-005**: The system shall track last used timestamp for each device.

### 2.5 Face Profile Management

**REQ-FACE-001**: The system shall allow customers to register their face profile during onboarding.

**REQ-FACE-002**: The system shall encrypt face encoding data using AES-256-GCM before storage.

**REQ-FACE-003**: The system shall enforce one active face profile per user.

**REQ-FACE-004**: The system shall track verification count and last verified timestamp for each profile.

**REQ-FACE-005**: The system shall allow customers to update their face profile.

### 2.6 Risk Assessment and Analytics

**REQ-RISK-001**: The system shall allow agents to view detailed risk assessments for any request.

**REQ-RISK-002**: The system shall display all 7 risk factors with individual scores.

**REQ-RISK-003**: The system shall provide risk analytics including distribution of risk levels over time.

**REQ-RISK-004**: The system shall allow agents to filter risk logs by risk level, date range, and user.

**REQ-RISK-005**: The system shall generate risk recommendations for high and critical risk requests.

### 2.7 Audit Logging

**REQ-AUDIT-001**: The system shall log all authentication attempts with success/failure status.

**REQ-AUDIT-002**: The system shall log all state-changing operations (create, update, delete) with before/after snapshots.

**REQ-AUDIT-003**: The system shall log all agent actions (approve, deny, review) with agent ID and timestamp.

**REQ-AUDIT-004**: The system shall capture request metadata (IP address, user agent, timestamp) for all audit logs.

**REQ-AUDIT-005**: The system shall allow agents to search and filter audit logs by user, action, resource, and date range.

**REQ-AUDIT-006**: The system shall provide audit log export functionality in CSV and JSON formats.

**REQ-AUDIT-007**: The system shall retain audit logs for a minimum of 90 days.

### 2.8 Notification System

**REQ-NOTIF-001**: The system shall send notifications for critical events: swap request created, approved, denied, SIM lock changes, suspicious activity.

**REQ-NOTIF-002**: The system shall assign priority levels to notifications: low, medium, high, urgent.

**REQ-NOTIF-003**: The system shall allow users to view all their notifications with read/unread status.

**REQ-NOTIF-004**: The system shall allow users to mark notifications as read individually or in bulk.

**REQ-NOTIF-005**: The system shall allow users to delete notifications.

**REQ-NOTIF-006**: The system shall send real-time notifications for urgent events.

### 2.9 Role-Based Access Control (RBAC)

**REQ-RBAC-001**: The system shall enforce role-based access control for all API endpoints.

**REQ-RBAC-002**: Customer role shall have permissions: read/update own profile, create/cancel swap requests, manage own SIM locks, view own devices, manage own face profile.

**REQ-RBAC-003**: Agent role shall have permissions: view all swap requests, approve/deny requests, view risk assessments, view audit logs, access analytics.

**REQ-RBAC-004**: The system shall return HTTP 403 Forbidden for unauthorized access attempts.

**REQ-RBAC-005**: The system shall log all authorization failures for security auditing.

## 3. Non-Functional Requirements

### 3.1 Performance Requirements

**REQ-PERF-001**: Authentication endpoints shall respond within 200ms under normal load.

**REQ-PERF-002**: Swap request creation shall complete within 500ms.

**REQ-PERF-003**: Face verification shall complete within 2 seconds including external API calls.

**REQ-PERF-004**: Risk scoring shall complete within 1 second.

**REQ-PERF-005**: Agent list queries shall respond within 300ms.

**REQ-PERF-006**: The system shall support at least 100 concurrent users without performance degradation.

**REQ-PERF-007**: The system shall support horizontal scaling across multiple server instances.

### 3.2 Security Requirements

**REQ-SEC-001**: The system shall use HTTPS/TLS 1.3 for all client-server communication in production.

**REQ-SEC-002**: The system shall implement HTTP Strict Transport Security (HSTS) with 1-year max-age.

**REQ-SEC-003**: The system shall validate all user inputs against defined schemas before processing.

**REQ-SEC-004**: The system shall prevent SQL/NoSQL injection attacks through parameterized queries and ODM usage.

**REQ-SEC-005**: The system shall implement XSS prevention through output encoding and Content-Security-Policy headers.

**REQ-SEC-006**: The system shall implement CSRF protection using SameSite cookies and CSRF tokens.

**REQ-SEC-007**: The system shall implement rate limiting: 1000 requests/hour per IP globally, 5 login attempts/15 minutes per IP.

**REQ-SEC-008**: The system shall implement helmet.js middleware for security headers.

**REQ-SEC-009**: The system shall encrypt sensitive data at rest using AES-256-GCM.

**REQ-SEC-010**: The system shall use MongoDB encryption at rest for all stored data.

**REQ-SEC-011**: The system shall store API keys and secrets in environment variables, never in source code.

**REQ-SEC-012**: The system shall implement circuit breaker pattern for external service calls.

**REQ-SEC-013**: The system shall timeout external API calls after 10 seconds maximum.

### 3.3 Availability Requirements

**REQ-AVAIL-001**: The system shall have 99.5% uptime (excluding planned maintenance).

**REQ-AVAIL-002**: The system shall implement health check endpoints for load balancer monitoring.

**REQ-AVAIL-003**: The system shall implement graceful shutdown for maintenance operations.

**REQ-AVAIL-004**: The system shall use database connection pooling with automatic reconnection.

**REQ-AVAIL-005**: The system shall implement retry logic with exponential backoff for transient failures.

### 3.4 Scalability Requirements

**REQ-SCALE-001**: The system shall support horizontal scaling by adding more server instances.

**REQ-SCALE-002**: The system shall use stateless authentication (JWT) to enable scaling.

**REQ-SCALE-003**: The system shall use MongoDB read replicas for read-heavy operations.

**REQ-SCALE-004**: The system shall implement request queueing for background tasks (Bull with Redis).

**REQ-SCALE-005**: The system shall cache frequently accessed data in Redis with appropriate TTL.

### 3.5 Maintainability Requirements

**REQ-MAINT-001**: The system shall follow layered architecture: routes → controllers → services → models.

**REQ-MAINT-002**: The system shall use TypeScript for type safety and better maintainability.

**REQ-MAINT-003**: The system shall implement centralized error handling middleware.

**REQ-MAINT-004**: The system shall use structured logging (Winston) with log levels: error, warn, info, debug.

**REQ-MAINT-005**: The system shall implement standardized API response format: { success, data, error, message }.

**REQ-MAINT-006**: The system shall maintain minimum 80% code coverage for unit tests.

**REQ-MAINT-007**: The system shall document all API endpoints using OpenAPI/Swagger specification.

### 3.6 Reliability Requirements

**REQ-REL-001**: The system shall use database transactions for critical state updates.

**REQ-REL-002**: The system shall implement optimistic locking for concurrent request updates.

**REQ-REL-003**: The system shall validate data integrity before committing database transactions.

**REQ-REL-004**: The system shall implement idempotency for state-changing operations where applicable.

**REQ-REL-005**: The system shall log all errors with stack traces and context for debugging.

### 3.7 Compliance Requirements

**REQ-COMP-001**: The system shall implement audit logging for GDPR and CCPA compliance.

**REQ-COMP-002**: The system shall provide data export functionality for user data portability.

**REQ-COMP-003**: The system shall implement user data deletion upon request (right to be forgotten).

**REQ-COMP-004**: The system shall log all PII access for compliance auditing.

**REQ-COMP-005**: The system shall implement data retention policies (90 days for audit logs).

### 3.8 Monitoring and Observability

**REQ-MON-001**: The system shall integrate with APM tools (e.g., Sentry, New Relic) for error tracking.

**REQ-MON-002**: The system shall expose Prometheus-compatible metrics endpoints.

**REQ-MON-003**: The system shall implement distributed tracing for request flows.

**REQ-MON-004**: The system shall alert operations team for critical errors and performance degradation.

**REQ-MON-005**: The system shall log request/response times for performance monitoring.

## 4. Data Requirements

### 4.1 Database Collections

**REQ-DATA-001**: The system shall implement the following MongoDB collections: Users, SimLocks, SimSwapRequests, TrustedDevices, FaceProfiles, VerificationSessions, RiskLogs, AuditLogs, Notifications.

**REQ-DATA-002**: The system shall enforce referential integrity using ObjectId references between collections.

**REQ-DATA-003**: The system shall implement appropriate indexes for query optimization:
- Users: email (unique)
- SimSwapRequests: requestId (unique), userId, status, currentLayer, createdAt
- TrustedDevices: userId + deviceFingerprint (unique compound)
- FaceProfiles: userId (unique), isActive
- VerificationSessions: requestId, userId, status, expiresAt (TTL index)
- RiskLogs: requestId (unique), userId, riskLevel, calculatedAt
- AuditLogs: userId, agentId, action, resource, timestamp
- Notifications: userId + isRead + createdAt (compound index)

### 4.2 Data Validation

**REQ-DATA-004**: The system shall validate all data against Mongoose schemas before database operations.

**REQ-DATA-005**: The system shall enforce required fields, data types, and constraints at the model level.

**REQ-DATA-006**: The system shall implement schema versioning for backward compatibility.

### 4.3 Data Backup and Recovery

**REQ-DATA-007**: The system shall implement automated daily backups of the MongoDB database.

**REQ-DATA-008**: The system shall retain backups for a minimum of 30 days.

**REQ-DATA-009**: The system shall test backup restoration quarterly.

## 5. Integration Requirements

### 5.1 External Service Integration

**REQ-INT-001**: The system shall integrate with a face recognition API (e.g., AWS Rekognition, Azure Face API) for face verification.

**REQ-INT-002**: The system shall integrate with device fingerprinting services for device identification.

**REQ-INT-003**: The system shall integrate with telecom carrier APIs for intelligence data (optional).

**REQ-INT-004**: The system shall integrate with SMS gateway (e.g., Twilio) for notification delivery.

**REQ-INT-005**: The system shall integrate with email service (e.g., SendGrid) for email notifications.

**REQ-INT-006**: The system shall handle external service failures gracefully with appropriate error messages.

### 5.2 API Design

**REQ-API-001**: The system shall implement RESTful API design principles.

**REQ-API-002**: The system shall version all API endpoints (e.g., /api/v1/).

**REQ-API-003**: The system shall use appropriate HTTP methods: GET (read), POST (create), PUT (update), PATCH (partial update), DELETE (delete).

**REQ-API-004**: The system shall return appropriate HTTP status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 500 (server error), 503 (service unavailable).

**REQ-API-005**: The system shall implement pagination for list endpoints with default page size 20, max 100.

**REQ-API-006**: The system shall support filtering, sorting, and searching for list endpoints.

**REQ-API-007**: The system shall implement CORS configuration for allowed origins.

## 6. Testing Requirements

**REQ-TEST-001**: The system shall have unit tests for all services, utilities, and critical functions.

**REQ-TEST-002**: The system shall have integration tests for complete API workflows.

**REQ-TEST-003**: The system shall implement property-based tests using fast-check for critical algorithms.

**REQ-TEST-004**: The system shall achieve minimum 80% code coverage for services.

**REQ-TEST-005**: The system shall test all error scenarios and edge cases.

**REQ-TEST-006**: The system shall implement load testing for performance validation.

## 7. Documentation Requirements

**REQ-DOC-001**: The system shall provide comprehensive API documentation using OpenAPI/Swagger.

**REQ-DOC-002**: The system shall document all environment variables in .env.example file.

**REQ-DOC-003**: The system shall provide README with setup instructions, architecture overview, and deployment guide.

**REQ-DOC-004**: The system shall document all major architectural decisions.

**REQ-DOC-005**: The system shall provide inline code comments for complex logic.

## 8. Deployment Requirements

**REQ-DEPLOY-001**: The system shall support containerization using Docker.

**REQ-DEPLOY-002**: The system shall provide Docker Compose configuration for local development.

**REQ-DEPLOY-003**: The system shall support deployment to cloud platforms (AWS, Azure, GCP).

**REQ-DEPLOY-004**: The system shall use environment-specific configurations (development, staging, production).

**REQ-DEPLOY-005**: The system shall implement zero-downtime deployment strategies.

**REQ-DEPLOY-006**: The system shall implement database migration scripts for schema changes.

## 9. Constraints

**REQ-CONST-001**: The system shall use Node.js version 18.0.0 or higher.

**REQ-CONST-002**: The system shall use MongoDB version 6.0 or higher.

**REQ-CONST-003**: The system shall use TypeScript for all backend code.

**REQ-CONST-004**: The system shall follow the folder structure defined in the design document.

**REQ-CONST-005**: The system shall not store plaintext passwords or sensitive data.

**REQ-CONST-006**: The system shall not expose internal error details to clients in production.

## 10. Assumptions

**REQ-ASSUMP-001**: Users have access to email and mobile phone for verification.

**REQ-ASSUMP-002**: Users have modern web browsers supporting JavaScript and local storage.

**REQ-ASSUMP-003**: External face recognition APIs have 99% uptime.

**REQ-ASSUMP-004**: MongoDB Atlas provides high availability and automatic backups.

**REQ-ASSUMP-005**: Users understand TOTP authenticator app usage (Google Authenticator, Authy).
