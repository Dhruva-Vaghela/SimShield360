# Security Decision Engine - API Testing Examples

## 🧪 Complete Testing Guide

### Prerequisites

1. Server running: `npm run dev`
2. MongoDB connected
3. User registered and logged in
4. Access token obtained

---

## 📝 Test Scenarios

### Scenario 1: Low Risk - Auto Approve (Score: 0-30)

**Setup**: Clean user, no SIM lock, good verification

```bash
# Step 1: Create swap request
curl -X POST http://localhost:3000/api/v1/swap-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "currentPhoneNumber": "+1234567890",
    "newPhoneNumber": "+1987654321",
    "newSimCardNumber": "89012345678901234",
    "reason": "Upgrading to new phone, old SIM damaged",
    "deviceFingerprint": "trusted_device_fingerprint_123"
  }'

# Expected Risk Assessment:
# - SIM Lock Status: 0 (no lock)
# - Face Verification: 10 (90% match)
# - Authenticator: 0 (verified)
# - Trusted Device: 0 (trusted)
# - Location: 0 (consistent)
# - Device Changes: 0 (normal pattern)
# - Failed Attempts: 0 (none)
# - SIM Changes: 0 (first swap)
# - Port-Out: 0 (none)
# Total: ~2.0 (LOW RISK)
# Decision: APPROVED
```

---

### Scenario 2: Medium Risk - Manual Review (Score: 31-70)

**Setup**: Untrusted device, moderate verification

```bash
# Step 1: Register from new device
curl -X POST http://localhost:3000/api/v1/devices/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fingerprint": "new_untrusted_device_456",
    "deviceName": "Unknown Device",
    "deviceType": "mobile"
  }'

# Step 2: Create swap request from untrusted device
curl -X POST http://localhost:3000/api/v1/swap-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "currentPhoneNumber": "+1234567890",
    "newPhoneNumber": "+1555666777",
    "newSimCardNumber": "89099988877766655",
    "reason": "Need new SIM urgently",
    "deviceFingerprint": "new_untrusted_device_456"
  }'

# Expected Risk Assessment:
# - SIM Lock Status: 0 (no lock)
# - Face Verification: 30 (70% match - below threshold)
# - Authenticator: 70 (not verified)
# - Trusted Device: 60 (untrusted)
# - Location: 40 (IP changed)
# - Device Changes: 25 (2 devices in 7 days)
# - Failed Attempts: 0
# - SIM Changes: 0
# - Port-Out: 0
# Total: ~45.5 (MEDIUM RISK)
# Decision: PENDING_REVIEW
```

---

### Scenario 3: High Risk - Auto Deny (Score: 71-99)

**Setup**: Multiple failed attempts, suspicious patterns

```bash
# Simulate 3 failed attempts (reject previous requests)

# Step 1: Create request with multiple red flags
curl -X POST http://localhost:3000/api/v1/swap-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "currentPhoneNumber": "+1234567890",
    "newPhoneNumber": "+1999888777",
    "newSimCardNumber": "89011122233344455",
    "reason": "Lost phone",
    "deviceFingerprint": "suspicious_device_789"
  }'

# Expected Risk Assessment:
# - SIM Lock Status: 0
# - Face Verification: 80 (20% match - very low)
# - Authenticator: 70 (not verified)
# - Trusted Device: 60 (untrusted)
# - Location: 70 (country changed + new IP)
# - Device Changes: 50 (3+ devices in 7 days)
# - Failed Attempts: 50 (2 failures in 24h)
# - SIM Changes: 60 (2 swaps in 90 days)
# - Port-Out: 40 (1 attempt detected)
# Total: ~92.3 (HIGH RISK)
# Decision: REJECTED
```

---

### Scenario 4: Critical Risk - Immediate Block (Score: 100)

**Setup**: SIM lock active

```bash
# Step 1: Enable SIM lock
curl -X POST http://localhost:3000/api/v1/simlocks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phoneNumber": "+1234567890",
    "simCardNumber": "89012345678901234",
    "reason": "Security protection"
  }'

# Step 2: Try to create swap request (will be blocked)
curl -X POST http://localhost:3000/api/v1/swap-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "currentPhoneNumber": "+1234567890",
    "newPhoneNumber": "+1444555666",
    "newSimCardNumber": "89099999999999999",
    "reason": "Emergency swap needed"
  }'

# Expected Risk Assessment:
# - SIM Lock Status: 100 (ACTIVE LOCK - BLOCKS EVERYTHING)
# Total: 100 (CRITICAL)
# Decision: BLOCKED
# Message: "SIM lock is active - request blocked"
```

---

## 🔍 Testing Risk API Endpoints

### 1. Get Risk Assessment

```bash
curl -X GET "http://localhost:3000/api/v1/risk/requests/SWAP_REQUEST_ID" \
  -H "Authorization: Bearer AGENT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "riskScore": 46.15,
    "riskLevel": "medium",
    "decision": "pending_review",
    "factors": [
      {
        "factorName": "SIM Lock Status",
        "weight": 25,
        "score": 0,
        "weightedScore": 0,
        "status": "pass"
      },
      {
        "factorName": "Face Verification",
        "weight": 20,
        "score": 30,
        "weightedScore": 6.0,
        "status": "warning"
      }
    ],
    "recommendations": [
      "Face verification below threshold",
      "Request from untrusted device"
    ],
    "requiresManualReview": true
  }
}
```

---

### 2. Get Risk Logs

```bash
# Get all logs (agent/admin)
curl -X GET "http://localhost:3000/api/v1/risk/logs?page=1&limit=20" \
  -H "Authorization: Bearer AGENT_TOKEN"

# Filter by risk level
curl -X GET "http://localhost:3000/api/v1/risk/logs?riskLevel=high&page=1&limit=10" \
  -H "Authorization: Bearer AGENT_TOKEN"

# Filter by decision
curl -X GET "http://localhost:3000/api/v1/risk/logs?decision=rejected&page=1&limit=10" \
  -H "Authorization: Bearer AGENT_TOKEN"
```

---

### 3. Get Risk Analytics

```bash
# Get analytics for date range
curl -X GET "http://localhost:3000/api/v1/risk/analytics?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer AGENT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalAssessments": 1543,
      "averageRiskScore": 42.3,
      "highRiskCount": 234,
      "highRiskPercentage": 15.2
    },
    "distribution": {
      "riskLevel": {
        "low": 856,
        "medium": 453,
        "high": 214,
        "critical": 20
      },
      "decision": {
        "approved": 856,
        "pending_review": 453,
        "rejected": 214,
        "blocked": 20
      }
    },
    "topRiskFactors": [
      {
        "factor": "Face Verification",
        "averageScore": 65.4,
        "occurrences": 1543
      },
      {
        "factor": "Trusted Device",
        "averageScore": 48.2,
        "occurrences": 1543
      }
    ],
    "trends": [
      {
        "date": "2024-01-01",
        "totalAssessments": 45,
        "averageRiskScore": 38.2,
        "approved": 28,
        "rejected": 12,
        "blocked": 5
      }
    ]
  }
}
```

---

### 4. Get Risk Factors Detail

```bash
curl -X GET "http://localhost:3000/api/v1/risk/factors/SWAP_REQUEST_ID" \
  -H "Authorization: Bearer AGENT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "swapRequestId": "67891...",
    "assessmentDate": "2024-01-15T10:30:00Z",
    "riskScore": 46.15,
    "riskLevel": "medium",
    "decision": "pending_review",
    "factors": [
      {
        "name": "SIM Lock Status",
        "weight": 25,
        "score": 0,
        "weightedScore": 0,
        "status": "pass",
        "impact": "low",
        "details": {
          "isLocked": false,
          "message": "No active SIM lock"
        }
      },
      {
        "name": "Trusted Device",
        "weight": 15,
        "score": 60,
        "weightedScore": 9.0,
        "status": "warning",
        "impact": "medium",
        "details": {
          "isTrusted": false,
          "message": "Request from untrusted device"
        }
      }
    ],
    "summary": {
      "totalFactors": 9,
      "highImpactFactors": 2,
      "failedFactors": 0,
      "topContributor": "Trusted Device"
    }
  }
}
```

---

### 5. Simulate Risk Assessment (Admin Only)

```bash
curl -X POST http://localhost:3000/api/v1/risk/simulate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "phoneNumber": "+1234567890",
    "newPhoneNumber": "+1987654321",
    "deviceFingerprint": "test_device_fingerprint",
    "simLockStatus": false,
    "faceVerificationScore": 92,
    "authenticatorVerified": true,
    "trustedDevice": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "riskScore": 8.5,
    "riskLevel": "low",
    "decision": "approved",
    "factors": [...],
    "requiresManualReview": false
  }
}
```

---

### 6. Get Decision Explanation

```bash
curl -X GET "http://localhost:3000/api/v1/risk/explanation/SWAP_REQUEST_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "decision": "pending_review",
    "riskScore": 46.15,
    "riskLevel": "medium",
    "reason": "Medium risk score (46.15) - Manual review required",
    "confidence": 50,
    "escalationLevel": "medium",
    "recommendedAction": "Route to agent for manual verification",
    "additionalChecks": [
      "Review risk factors",
      "Verify primary authentication details"
    ],
    "escalationPath": [
      "Tier 1 Support",
      "Tier 2 Agent"
    ],
    "keyFactors": [
      {
        "name": "Trusted Device",
        "score": 60,
        "status": "warning"
      }
    ]
  }
}
```

---

## 🎯 Testing Workflows

### Complete Low-Risk Flow

```bash
# 1. Register user
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

# 2. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# 3. Register trusted device
curl -X POST http://localhost:3000/api/v1/devices/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "fingerprint": "trusted_device_123",
    "deviceName": "My iPhone",
    "deviceType": "mobile",
    "browser": "Safari",
    "os": "iOS 17"
  }'

# 4. Create swap request (will be auto-approved)
curl -X POST http://localhost:3000/api/v1/swap-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "currentPhoneNumber": "+1234567890",
    "newPhoneNumber": "+1987654321",
    "newSimCardNumber": "89012345678901234",
    "reason": "Upgrading to new phone",
    "deviceFingerprint": "trusted_device_123"
  }'

# 5. Check workflow status
curl -X GET "http://localhost:3000/api/v1/swap-requests/REQUEST_ID/workflow" \
  -H "Authorization: Bearer TOKEN"

# 6. Check risk assessment
curl -X GET "http://localhost:3000/api/v1/risk/requests/REQUEST_ID" \
  -H "Authorization: Bearer AGENT_TOKEN"
```

---

### Complete High-Risk Flow

```bash
# 1. Create multiple failed attempts (simulate)
# Request 1-3: Create and reject

# 2. Change location (simulate by using VPN/different IP)

# 3. Use untrusted device
curl -X POST http://localhost:3000/api/v1/swap-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "currentPhoneNumber": "+1234567890",
    "newPhoneNumber": "+1999888777",
    "newSimCardNumber": "89099988877766655",
    "reason": "Lost phone urgently",
    "deviceFingerprint": "unknown_device_999"
  }'

# 4. Request will be auto-rejected (risk score > 90)

# 5. Agent reviews rejection
curl -X GET "http://localhost:3000/api/v1/risk/explanation/REQUEST_ID" \
  -H "Authorization: Bearer AGENT_TOKEN"
```

---

## 📊 Performance Testing

### Load Test Risk Assessment

```bash
# Test 1000 risk assessments
for i in {1..1000}
do
  curl -X POST http://localhost:3000/api/v1/risk/simulate \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ADMIN_TOKEN" \
    -d "{\"phoneNumber\":\"+123456789$i\",\"faceVerificationScore\":$((RANDOM % 100))}" \
    > /dev/null 2>&1 &
done

# Expected: All requests complete in < 5 seconds
```

---

## 🐛 Troubleshooting

### Issue: Risk score always 50

**Cause**: Error in factor assessment

**Solution**: Check logs for specific factor errors

```bash
# Check recent logs
tail -f logs/app.log | grep "assessment error"
```

### Issue: All requests approved

**Cause**: Thresholds misconfigured

**Solution**: Verify decision thresholds in `decision.service.ts`

---

## ✅ Success Criteria

- [ ] Low-risk requests auto-approved (score < 30)
- [ ] Medium-risk requests pending review (score 30-89)
- [ ] High-risk requests auto-rejected (score 90-99)
- [ ] Critical-risk requests blocked (score 100)
- [ ] SIM lock blocks all requests
- [ ] Failed attempts increase risk score
- [ ] Risk logs saved correctly
- [ ] Analytics display correct data
- [ ] Factor explanations clear and accurate

---

**Happy Testing! 🚀**
