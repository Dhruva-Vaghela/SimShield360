# SIMShield 360 Backend

Enterprise-grade Multi-Layer SIM Swap Prevention & Authorization Firewall

## Overview

SIMShield 360 is a comprehensive telecom security platform that prevents SIM swap, eSIM transfer, and port-out fraud through a sophisticated 7-layer authorization firewall. The backend system implements multi-tiered security validation workflows with real-time risk assessment, comprehensive audit logging, and role-based access control.

## Architecture

### 7-Layer Security Firewall

1. **Layer 1: SIM Lock Firewall** - Immediate block if SIM lock is active
2. **Layer 2: Face Verification** - Biometric face matching with 85% threshold
3. **Layer 3: Authenticator Verification** - TOTP code validation
4. **Layer 4: Trusted Device Consent** - Device fingerprinting and trust management
5. **Layer 5: Telecom Intelligence** - Account history and carrier data analysis
6. **Layer 6: Risk Scoring Engine** - Weighted risk factor aggregation (7 factors)
7. **Layer 7: Final Decision Engine** - Auto-approve (<30), auto-deny (≥90), manual review (30-89)

### Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js v4.18+
- **Database**: MongoDB Atlas (M10+ cluster)
- **Authentication**: JWT (JSON Web Tokens)
- **Language**: TypeScript v5.3+
- **ODM**: Mongoose v8.0+
- **Caching**: Redis (optional)
- **Queue**: Bull (optional)

### Folder Structure

```
backend/
├── src/
│   ├── config/               # Configuration files
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── environment.config.ts
│   │   └── constants.ts
│   ├── models/               # Mongoose schemas and models
│   │   ├── User.model.ts
│   │   ├── SimLock.model.ts
│   │   ├── SimSwapRequest.model.ts
│   │   ├── TrustedDevice.model.ts
│   │   ├── FaceProfile.model.ts
│   │   ├── VerificationSession.model.ts
│   │   ├── RiskLog.model.ts
│   │   ├── AuditLog.model.ts
│   │   └── Notification.model.ts
│   ├── routes/               # API route definitions
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── simlock.routes.ts
│   │   ├── swap.routes.ts
│   │   ├── verification.routes.ts
│   │   ├── risk.routes.ts
│   │   ├── audit.routes.ts
│   │   ├── device.routes.ts
│   │   └── notification.routes.ts
│   ├── controllers/          # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── simlock.controller.ts
│   │   ├── swap.controller.ts
│   │   ├── verification.controller.ts
│   │   ├── risk.controller.ts
│   │   ├── audit.controller.ts
│   │   ├── device.controller.ts
│   │   └── notification.controller.ts
│   ├── services/             # Business logic
│   │   ├── auth/
│   │   │   ├── jwt.service.ts
│   │   │   ├── password.service.ts
│   │   │   └── session.service.ts
│   │   ├── user/
│   │   │   └── user.service.ts
│   │   ├── simlock/
│   │   │   └── simlock.service.ts
│   │   ├── swap/
│   │   │   ├── swap.service.ts
│   │   │   └── workflow.service.ts
│   │   ├── verification/
│   │   │   ├── face.service.ts
│   │   │   ├── authenticator.service.ts
│   │   │   └── device.service.ts
│   │   ├── intelligence/
│   │   │   └── telecom.service.ts
│   │   ├── risk/
│   │   │   ├── scoring.service.ts
│   │   │   └── decision.service.ts
│   │   ├── audit/
│   │   │   └── audit.service.ts
│   │   └── notification/
│   │       └── notification.service.ts
│   ├── middleware/           # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   ├── logging.middleware.ts
│   │   └── cors.middleware.ts
│   ├── validators/           # Request validation schemas
│   │   ├── auth.validator.ts
│   │   ├── simlock.validator.ts
│   │   ├── swap.validator.ts
│   │   └── common.validator.ts
│   ├── types/                # TypeScript definitions
│   │   ├── common.types.ts
│   │   ├── express.d.ts
│   │   ├── swap.types.ts
│   │   └── risk.types.ts
│   ├── utils/                # Utility functions
│   │   ├── crypto.util.ts
│   │   ├── date.util.ts
│   │   ├── response.util.ts
│   │   └── logger.util.ts
│   ├── app.ts                # Express app configuration
│   └── server.ts             # Server entry point
├── tests/                    # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example              # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js v18 or higher
- MongoDB Atlas cluster
- Redis (optional for production)

### Installation

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables
# Edit .env file with your configuration
```

### Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/simshield?retryWrites=true&w=majority
MONGODB_DB_NAME=simshield

# JWT
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Face Recognition API (optional)
FACE_API_ENDPOINT=https://api.face-recognition.com
FACE_API_KEY=your-face-api-key

# External Services (optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
SENDGRID_API_KEY=your-sendgrid-api-key
```

### Running the Application

```bash
# Development mode
npm run dev

# Production mode
npm run start
```

## API Documentation

Once the server is running, visit:

- Swagger UI: `http://localhost:3000/api-docs`
- API Base URL: `http://localhost:3000/api/v1`

## Authentication

The API uses JWT tokens for authentication:

1. **Login**: POST `/api/v1/auth/login`
2. **Get Access Token**: Include `Authorization: Bearer <access_token>` header
3. **Refresh Token**: POST `/api/v1/auth/refresh-token`

## Security Features

- **Rate Limiting**: 1000 requests/hour per IP (globally), 5 login attempts/15 minutes
- **Password Security**: bcrypt with 12 salt rounds
- **JWT Tokens**: 15-minute access tokens, 7-day refresh tokens
- **RBAC**: Role-based access control (customer, agent, admin)
- **Audit Logging**: Comprehensive audit trail for all operations
- **Input Validation**: Zod schemas for all API requests
- **SQL/NoSQL Injection Prevention**: Parameterized queries and ODM usage
- **XSS Prevention**: Output encoding and CSP headers
- **CSRF Protection**: SameSite cookies and CSRF tokens

## Database Collections

| Collection | Description |
|------------|-------------|
| `users` | User accounts with roles and authenticator |
| `simlocks` | SIM lock status and history |
| `simswaprequests` | Swap request workflow and layer results |
| `trusteddevices` | Device fingerprints and trust status |
| `faceprofiles` | Encrypted face verification data |
| `verificationsessions` | Active verification sessions |
| `risklogs` | Risk assessment results |
| `auditlogs` | Complete audit trail |
| `notifications` | User notifications |

## Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test

# Test coverage
npm run test:cov
```

## Deployment

### Docker

```bash
# Build image
docker build -t simshield-backend .

# Run container
docker run -p 3000:3000 --env-file .env simshield-backend
```

### Kubernetes

See `kubernetes/` directory for deployment manifests.

## Monitoring

- **APM**: Integrate with Sentry or New Relic
- **Metrics**: Prometheus endpoints at `/metrics`
- **Health Check**: `/health` endpoint
- **Logging**: Structured logging with Winston

## Development

### Code Quality

```bash
# Linting
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

### Project Structure Guidelines

1. **Layered Architecture**: Routes → Controllers → Services → Models
2. **Single Responsibility**: Each service handles one domain
3. **Type Safety**: Use TypeScript interfaces for all data structures
4. **Error Handling**: Centralized error middleware with custom error classes
5. **Validation**: Zod schemas for all input validation
6. **Logging**: Structured logging with context
7. **Testing**: Unit, integration, and E2E tests for all components

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh-token` - Refresh JWT token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/me` - Get current user profile
- `PUT /api/v1/auth/profile` - Update user profile

### SIM Lock
- `GET /api/v1/simlocks` - Get user's SIM locks
- `POST /api/v1/simlocks` - Create SIM lock
- `PUT /api/v1/simlocks/:id/lock` - Enable SIM lock
- `PUT /api/v1/simlocks/:id/unlock` - Disable SIM lock

### Swap Requests
- `POST /api/v1/swap-requests` - Create swap request
- `GET /api/v1/swap-requests` - List user's requests
- `GET /api/v1/swap-requests/:id` - Get request details
- `PUT /api/v1/swap-requests/:id/cancel` - Cancel request
- `POST /api/v1/swap-requests/:id/approve` - Approve (agent)
- `POST /api/v1/swap-requests/:id/deny` - Deny (agent)

### Verification
- `POST /api/v1/verification/face` - Submit face verification
- `POST /api/v1/verification/authenticator` - Submit TOTP code
- `POST /api/v1/verification/device-consent` - Grant device consent

### Risk & Audit
- `GET /api/v1/risk/requests/:id` - Get risk assessment
- `GET /api/v1/audit/logs` - List audit logs
- `GET /api/v1/notifications` - Get notifications

See OpenAPI spec for full endpoint documentation.

## License

MIT License - See LICENSE file for details.