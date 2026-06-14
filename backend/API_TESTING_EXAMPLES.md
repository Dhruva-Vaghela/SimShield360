# API Testing Examples

## Authentication

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "phoneNumber": "+1234567890",
  "role": "customer"
}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "customer@example.com",
  "password": "SecurePass123!"
}'
```

## Google Authenticator Setup

### 1. Setup Authenticator (Get QR Code)
```bash
curl -X POST http://localhost:5000/api/verification/authenticator/setup \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```
Response:
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "data:image/png;base64,iVBORw0KG...",
    "message": "Scan QR code with Google Authenticator"
  }
}
```

### 2. Enable Authenticator (Verify Initial Code)
```bash
curl -X POST http://localhost:5000/api/verification/authenticator/enable \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "secret": "JBSWY3DPEHPK3PXP",
  "code": "123456"
}'
```

### 3. Get Authenticator Status
```bash
curl -X GET http://localhost:5000/api/verification/authenticator/status \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Disable Authenticator
```bash
curl -X POST http://localhost:5000/api/verification/authenticator/disable \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "code": "123456"
}'
```

## SIM Swap Request

### Create SIM Swap Request
```bash
curl -X POST http://localhost:5000/api/swap/request \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "phoneNumber": "+1234567890",
  "currentSimIccid": "89014103211234567890",
  "newSimIccid": "89014103219876543210",
  "reason": "Lost SIM card"
}'
```

### Get Request Status
```bash
curl -X GET http://localhost:5000/api/swap/requests/REQUEST_ID \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Verification Layers

### Layer 1: SIM Lock Check (Automatic)

### Layer 2: Face Verification (Simulation)
```bash
curl -X POST http://localhost:5000/api/verification/face \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "requestId": "REQUEST_UUID",
  "simulationResult": "match"
}'
```
Options: "match" (confidence: 96) or "no_match" (confidence: 42)

### Layer 3: Google Authenticator
```bash
curl -X POST http://localhost:5000/api/verification/authenticator \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "requestId": "REQUEST_UUID",
  "code": "123456"
}'
```

### Layer 4: Device Trust
```bash
curl -X POST http://localhost:5000/api/verification/device-consent \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "requestId": "REQUEST_UUID",
  "deviceFingerprint": "abc123def456",
  "deviceName": "iPhone 14",
  "deviceType": "mobile",
  "browser": "Safari",
  "os": "iOS 17"
}'
```

## Risk Analysis

### Get Risk Score
```bash
curl -X GET http://localhost:5000/api/risk/score/USER_ID \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Risk History
```bash
curl -X GET http://localhost:5000/api/risk/history/USER_ID \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## SIM Lock Management

### Get Lock Status
```bash
curl -X GET http://localhost:5000/api/simlock/status \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Enable Lock
```bash
curl -X POST http://localhost:5000/api/simlock/enable \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "phoneNumber": "+1234567890"
}'
```

### Disable Lock
```bash
curl -X POST http://localhost:5000/api/simlock/disable \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "phoneNumber": "+1234567890",
  "code": "123456"
}'
```

## Admin Operations

### Approve Request
```bash
curl -X POST http://localhost:5000/api/swap/requests/REQUEST_ID/approve \
-H "Authorization: Bearer ADMIN_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "notes": "Verified all layers"
}'
```

### Reject Request
```bash
curl -X POST http://localhost:5000/api/swap/requests/REQUEST_ID/reject \
-H "Authorization: Bearer ADMIN_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "reason": "Failed authentication",
  "notes": "Multiple failed attempts"
}'
```

## Audit Logs

### Get User Audit Logs
```bash
curl -X GET http://localhost:5000/api/audit/user/USER_ID \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get System Audit Logs (Admin)
```bash
curl -X GET "http://localhost:5000/api/audit/logs?limit=50&action=sim_swap_requested" \
-H "Authorization: Bearer ADMIN_JWT_TOKEN"
```
