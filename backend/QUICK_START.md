# SIMShield 360 Backend - Quick Start Guide

## ✅ What's Been Implemented

All 4 modules have been fully implemented with complete routes, controllers, services, middleware, and validators:

### 1. **Authentication Module** ✅
- Register, Login, Logout
- JWT token generation and validation
- Password reset flow
- Profile management
- TOTP authenticator setup
- Role-based access control

### 2. **SIM Lock Module** ✅
- Create SIM lock
- Enable/Disable SIM lock
- Get status and history
- Lock validation for swap requests

### 3. **SIM Swap Request Module** ✅
- Create swap request
- 7-layer security workflow processing
- Approve/Reject (agent/admin)
- Cancel (customer)
- Workflow status tracking

### 4. **Trusted Device Module** ✅
- Register device
- Remove device
- List devices
- Device fingerprinting
- Trust management

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Your `.env` file is already configured with:
- MongoDB Atlas connection
- JWT secrets
- API keys (Face++, Twilio, SendGrid)
- Rate limiting settings

### 3. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📋 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh-token` - Refresh JWT
- `GET /auth/me` - Get profile
- `PUT /auth/profile` - Update profile

### SIM Lock
- `GET /simlocks` - List user's SIM locks
- `POST /simlocks` - Create SIM lock
- `PUT /simlocks/:id/lock` - Enable lock
- `PUT /simlocks/:id/unlock` - Disable lock
- `GET /simlocks/:id/status` - Get status

### Swap Requests
- `POST /swap-requests` - Create request
- `GET /swap-requests` - List requests
- `GET /swap-requests/:id` - Get details
- `PUT /swap-requests/:id/cancel` - Cancel
- `POST /swap-requests/:id/approve` - Approve (agent)
- `POST /swap-requests/:id/reject` - Reject (agent)

### Devices
- `GET /devices` - List devices
- `POST /devices/register` - Register device
- `DELETE /devices/:id` - Remove device
- `POST /devices/:id/revoke` - Revoke trust

## 🧪 Testing Endpoints

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+1234567890"
    }
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Save the `accessToken` from the response.

### 3. Create SIM Lock
```bash
curl -X POST http://localhost:3000/api/v1/simlocks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "phoneNumber": "+1234567890",
    "simCardNumber": "89012345678901234",
    "reason": "Security lock"
  }'
```

### 4. Create Swap Request
```bash
curl -X POST http://localhost:3000/api/v1/swap-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "currentPhoneNumber": "+1234567890",
    "newPhoneNumber": "+1987654321",
    "newSimCardNumber": "89012345678901234",
    "reason": "Lost my phone and need a replacement SIM"
  }'
```

## 🔒 Security Features

- **JWT Authentication**: 15-minute access tokens, 7-day refresh tokens
- **Rate Limiting**: 
  - Global: 100 requests/15 minutes
  - Auth: 5 attempts/15 minutes
  - Swap requests: 5 requests/hour per user
- **Password Requirements**:
  - Minimum 8 characters
  - Uppercase and lowercase letters
  - Numbers and special characters
- **RBAC**: customer, agent, admin roles
- **Audit Logging**: All actions logged

## 📊 7-Layer Security Workflow

When a swap request is created, it goes through:

1. **Layer 1**: SIM Lock Firewall - Blocks if SIM is locked
2. **Layer 2**: Face Verification - Biometric matching
3. **Layer 3**: Authenticator - TOTP code validation
4. **Layer 4**: Device Consent - Trusted device check
5. **Layer 5**: Telecom Intelligence - Account history
6. **Layer 6**: Risk Scoring - 7-factor risk analysis
7. **Layer 7**: Decision Engine - Auto-approve/deny/manual review

**Decision Thresholds:**
- Risk Score < 30: Auto-approved
- Risk Score 30-89: Manual review required
- Risk Score ≥ 90: Auto-denied

## 🐛 Known Issues

Some TypeScript compilation warnings exist (unused parameters, etc.) but they don't affect functionality. The application runs correctly.

To suppress warnings during development:
```bash
npm run dev
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers (4 controllers)
│   ├── services/        # Business logic (5+ services)
│   ├── routes/          # API routes (4 route files)
│   ├── middleware/      # Auth, RBAC, validation, etc.
│   ├── models/          # Mongoose schemas (9 models)
│   ├── validators/      # Zod schemas (4 validators)
│   ├── types/           # TypeScript types
│   ├── utils/           # Helpers (logger, crypto, response)
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── .env                 # Environment variables (configured)
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## 🎯 Next Steps

1. **Create Admin User** (optional)
   ```bash
   npm run seed:admin
   ```

2. **Test All Endpoints** using the examples above

3. **Monitor Logs** - All operations are logged to console

4. **Database** - Check MongoDB Atlas for data:
   - Users collection
   - SimLocks collection
   - SimSwapRequests collection
   - TrustedDevices collection
   - AuditLogs collection

## 💡 Tips

- Use tools like **Postman** or **Insomnia** for easier API testing
- The `/health` endpoint checks if the server is running
- All responses follow a standard format:
  ```json
  {
    "success": true|false,
    "data": {...},
    "error": {...},
    "pagination": {...}
  }
  ```

## 📞 Support

Check `IMPLEMENTATION_SUMMARY.md` for complete details on:
- All implemented features
- API endpoint documentation
- Architecture overview
- Testing guidelines

---

**Ready to use! Start the server with `npm run dev` and begin testing.** 🚀
