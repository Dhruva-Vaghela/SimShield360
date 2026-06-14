# SIMShield 360 - Security Decision Engine Documentation

## 🧠 Overview

The Security Decision Engine is the **central fraud prevention brain** of SIMShield 360. It evaluates every SIM swap request through a sophisticated 9-factor risk assessment algorithm and makes intelligent decisions to approve, reject, or block requests.

---

## 🎯 Architecture

### Components

1. **Risk Scoring Service** (`scoring.service.ts`) - Calculates risk scores
2. **Decision Service** (`decision.service.ts`) - Makes final decisions
3. **Risk Controller** (`risk.controller.ts`) - Handles API requests
4. **Workflow Integration** - Processes requests through all layers

---

## 📊 Risk Scoring Algorithm

### Risk Factors & Weights (Total: 100)

| Factor | Weight | Description | Risk Range |
|--------|--------|-------------|------------|
| **SIM Lock Status** | 25 | Active SIM lock blocks request | 0 or 100 |
| **Face Verification** | 20 | Biometric face matching | 0-100 |
| **Authenticator** | 15 | TOTP verification | 0 or 70 |
| **Trusted Device** | 15 | Device trust status | 0 or 60 |
| **Location Analysis** | 10 | Geographic risk assessment | 0-100 |
| **Device Changes** | 5 | Device change pattern | 0-100 |
| **Failed Attempts** | 5 | Recent failed requests | 0-100 |
| **SIM Changes** | 3 | Recent swap history | 0-90 |
| **Port-Out Activity** | 2 | Port-out attempt detection | 0-100 |

### Calculation Formula

```typescript
Total Risk Score = Σ (Factor Score × Factor Weight / 100)

Where:
- Factor Score: Individual risk score (0-100)
- Factor Weight: Importance weight (0-100)
- Weighted Score: Factor Score × (Weight / 100)
```

**Example:**
```
SIM Lock Status:     100 × 0.25 = 25.0
Face Verification:    30 × 0.20 =  6.0
Authenticator:         0 × 0.15 =  0.0
Trusted Device:       60 × 0.15 =  9.0
Location Analysis:    40 × 0.10 =  4.0
Device Changes:       25 × 0.05 =  1.25
Failed Attempts:       0 × 0.05 =  0.0
SIM Changes:          30 × 0.03 =  0.9
Port-Out Activity:     0 × 0.02 =  0.0
─────────────────────────────────────
Total Risk Score:              46.15
```

---

## 🚦 Risk Levels

### Classification

| Risk Score | Level | Color | Description |
|------------|-------|-------|-------------|
| **0-30** | Low | 🟢 Green | Safe, normal behavior |
| **31-70** | Medium | 🟡 Yellow | Suspicious, needs review |
| **71-99** | High | 🟠 Orange | Very suspicious |
| **100** | Critical | 🔴 Red | Immediate block |

---

## ⚖️ Decision Logic

### Decision Thresholds

```typescript
DECISION_THRESHOLDS = {
  AUTO_APPROVE_MAX: 30,      // 0-30 = Auto-approve
  MANUAL_REVIEW_MIN: 30,     // 30-89 = Manual review
  MANUAL_REVIEW_MAX: 89,
  AUTO_DENY_MIN: 90,         // 90-99 = Auto-deny
  CRITICAL_BLOCK: 100,       // 100 = Immediate block
}
```

### Decision Types

| Decision | Risk Score | Action | Reversible |
|----------|------------|--------|------------|
| **APPROVED** | 0-30 | Auto-approve swap | Yes |
| **PENDING_REVIEW** | 31-89 | Route to agent | Yes |
| **REJECTED** | 90-99 | Auto-deny swap | Yes |
| **BLOCKED** | 100 or critical violations | Immediate block | No* |

\* Blocked requests require management approval to override

### Decision Flow

```
┌─────────────────────────┐
│   Risk Assessment       │
│   (9 Factors)           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Calculate Total Score  │
└───────────┬─────────────┘
            │
            ▼
    ┌───────┴───────┐
    │ Score < 30?   │
    └───┬───────┬───┘
   Yes  │       │ No
        ▼       ▼
    ┌────────┐ ┌────────────────┐
    │APPROVED│ │ Score >= 90?   │
    └────────┘ └───┬────────┬───┘
              Yes  │        │ No
                   ▼        ▼
              ┌─────────┐ ┌────────────────┐
              │REJECTED │ │Score = 100?    │
              └─────────┘ └───┬────────┬───┘
                         Yes  │        │ No
                              ▼        ▼
                         ┌────────┐ ┌──────────────┐
                         │BLOCKED │ │PENDING_REVIEW│
                         └────────┘ └──────────────┘
```

---

## 🔍 Risk Factor Details

### 1. SIM Lock Status (Weight: 25)

**Purpose**: First line of defense - immediately blocks if user has activated SIM lock.

**Logic**:
```typescript
if (SIM lock is active) {
  score = 100  // Critical - immediate block
} else {
  score = 0    // Safe to proceed
}
```

**Status**:
- ✅ Pass: No active SIM lock
- ❌ Fail: SIM lock is active → **IMMEDIATE BLOCK**

---

### 2. Face Verification (Weight: 20)

**Purpose**: Biometric verification to confirm user identity.

**Logic**:
```typescript
matchScore = Face API match percentage (0-100)
threshold = 85%

riskScore = max(0, 100 - matchScore)

// Examples:
// 95% match → 5% risk
// 85% match → 15% risk
// 50% match → 50% risk
```

**Status**:
- ✅ Pass: Match score ≥ 85%
- ⚠️ Warning: Match score 1-84%
- ❌ Fail: Match score = 0% (not completed)

---

### 3. Authenticator Verification (Weight: 15)

**Purpose**: Two-factor authentication with TOTP.

**Logic**:
```typescript
if (TOTP verified) {
  score = 0    // Very safe
} else if (user has authenticator enabled) {
  score = 70   // High risk - should be verified
} else {
  score = 50   // Medium risk - no 2FA enabled
}
```

**Status**:
- ✅ Pass: TOTP verified
- ⚠️ Warning: Authenticator not enabled
- ❌ Fail: Authenticator enabled but not verified

---

### 4. Trusted Device (Weight: 15)

**Purpose**: Verify request comes from a recognized device.

**Logic**:
```typescript
if (device fingerprint matches trusted device) {
  score = 0
} else {
  score = 60   // Unknown device
}
```

**Device Fingerprint**: SHA-256 hash of IP + User Agent + Browser fingerprint

**Status**:
- ✅ Pass: Trusted device
- ⚠️ Warning: Untrusted device

---

### 5. Location Analysis (Weight: 10)

**Purpose**: Detect suspicious geographic changes.

**Logic**:
```typescript
score = 0

if (IP changed from historical) {
  score += 40
}

if (country changed) {
  score += 30
}

if (high-risk country) {
  score += 20
}

riskScore = min(score, 100)
```

**High-Risk Indicators**:
- New IP address (not seen in last 30 days)
- Country change
- High-risk geographic regions
- VPN/Proxy usage

---

### 6. Device Change Analysis (Weight: 5)

**Purpose**: Detect rapid device switching patterns.

**Logic**:
```typescript
score = 0

if (3+ devices registered in last 7 days) {
  score += 50
} else if (2 devices in last 7 days) {
  score += 25
}

if (10+ total devices) {
  score += 30
} else if (5+ total devices) {
  score += 15
}
```

**Suspicious Patterns**:
- Multiple device registrations in short period
- Unusually high total device count

---

### 7. Failed Attempts (Weight: 5)

**Purpose**: Detect brute-force or repeated attempts.

**Logic**:
```typescript
failedCount = rejected requests in last 24 hours

if (failedCount >= 5) {
  score = 100  // Immediate block
} else if (failedCount >= 3) {
  score = 80
} else if (failedCount >= 2) {
  score = 50
} else if (failedCount == 1) {
  score = 25
} else {
  score = 0
}
```

**Thresholds**:
- 5+ failures → Automatic block
- 3-4 failures → High risk
- 1-2 failures → Medium risk

---

### 8. Recent SIM Changes (Weight: 3)

**Purpose**: Detect unusual SIM swap patterns.

**Logic**:
```typescript
recentSwaps = approved swaps in last 90 days

if (recentSwaps >= 3) {
  score = 90   // Very suspicious
} else if (recentSwaps == 2) {
  score = 60
} else if (recentSwaps == 1) {
  score = 30
} else {
  score = 0
}
```

**Normal Pattern**: 0-1 swaps per year
**Suspicious**: 2+ swaps in 90 days

---

### 9. Port-Out Activity (Weight: 2)

**Purpose**: Detect carrier porting attempts.

**Logic**:
```typescript
portOutAttempts = detected port-out requests in last 30 days

score = min(portOutAttempts × 40, 100)
```

**Integration**: Would connect to carrier API to detect actual port-out requests

---

## 🎮 API Endpoints

### 1. Assess Risk for Swap Request

```http
GET /api/v1/risk/requests/:id
Authorization: Bearer <token>
Role: Agent, Admin
```

**Response**:
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
        "score": 100,
        "weightedScore": 25.0,
        "status": "fail",
        "details": {
          "isLocked": true,
          "message": "SIM lock is active"
        }
      }
    ],
    "recommendations": [
      "Face verification failed or not completed",
      "Request from untrusted device"
    ],
    "requiresManualReview": true
  }
}
```

---

### 2. Get Risk Logs

```http
GET /api/v1/risk/logs?page=1&limit=20&riskLevel=high
Authorization: Bearer <token>
Role: Agent, Admin (all logs), Customer (own logs)
```

---

### 3. Get Risk Analytics

```http
GET /api/v1/risk/analytics?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
Role: Agent, Admin
```

**Response**:
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

### 4. Get Risk Factors

```http
GET /api/v1/risk/factors/:requestId
Authorization: Bearer <token>
Role: Agent, Admin
```

---

### 5. Simulate Risk Assessment

```http
POST /api/v1/risk/simulate
Authorization: Bearer <token>
Role: Admin
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "newPhoneNumber": "+1987654321",
  "deviceFingerprint": "abc123...",
  "simLockStatus": false,
  "faceVerificationScore": 92,
  "authenticatorVerified": true,
  "trustedDevice": true
}
```

---

### 6. Get Decision Explanation

```http
GET /api/v1/risk/explanation/:requestId
Authorization: Bearer <token>
```

**Response**:
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
        "name": "SIM Lock Status",
        "score": 100,
        "status": "fail"
      }
    ]
  }
}
```

---

## 🔄 Integration with 7-Layer Workflow

The Security Decision Engine integrates with the 7-layer security workflow:

```
Layer 1: SIM Lock Firewall
         ↓
Layer 2: Face Verification
         ↓
Layer 3: Authenticator
         ↓
Layer 4: Trusted Device
         ↓
Layer 5: Telecom Intelligence
         ↓
Layer 6: Risk Scoring Engine ← 🧠 **Security Decision Engine**
         ↓
Layer 7: Final Decision Engine ← 🧠 **Security Decision Engine**
         ↓
    Final Decision
```

---

## 📈 Performance Metrics

### Accuracy Targets

- **False Positive Rate**: < 2% (legitimate requests blocked)
- **False Negative Rate**: < 0.5% (fraudulent requests approved)
- **Detection Rate**: > 98% (fraud successfully detected)

### Processing Time

- Risk assessment: < 2 seconds
- Full workflow: < 5 seconds
- Decision making: < 100ms

---

## 🛡️ Security Considerations

### Data Protection

- Risk logs encrypted at rest
- PII minimization in logging
- Secure factor weight storage
- Audit trail for all decisions

### Compliance

- GDPR compliant (data minimization, right to explanation)
- SOC 2 Type II controls
- PCI DSS where applicable

---

## 🎓 Best Practices

### For Agents

1. **Review Medium-Risk Cases** (30-70 score)
   - Check factor details
   - Contact user if needed
   - Document decision rationale

2. **Escalate High-Risk Cases** (70+ score)
   - Notify supervisor
   - Perform additional verification
   - Consider account freeze

3. **Monitor Trends**
   - Check daily analytics
   - Identify patterns
   - Report anomalies

### For Administrators

1. **Tune Thresholds**
   - Monitor false positive/negative rates
   - Adjust factor weights if needed
   - Update decision thresholds based on data

2. **Review Blocked Cases**
   - Investigate critical blocks
   - Look for systematic fraud
   - Update detection rules

---

## 🔧 Configuration

### Risk Weights (Configurable)

Located in: `src/services/risk/scoring.service.ts`

```typescript
export const RISK_WEIGHTS = {
  SIM_LOCK_STATUS: 25,
  FACE_VERIFICATION: 20,
  AUTHENTICATOR_VERIFICATION: 15,
  TRUSTED_DEVICE: 15,
  LOCATION_ANALYSIS: 10,
  DEVICE_CHANGE_ANALYSIS: 5,
  FAILED_ATTEMPTS: 5,
  RECENT_SIM_CHANGES: 3,
  PORT_OUT_ACTIVITY: 2,
};
```

### Decision Thresholds (Configurable)

Located in: `src/services/risk/decision.service.ts`

```typescript
export const DECISION_THRESHOLDS = {
  AUTO_APPROVE_MAX: 30,
  MANUAL_REVIEW_MIN: 30,
  MANUAL_REVIEW_MAX: 89,
  AUTO_DENY_MIN: 90,
  CRITICAL_BLOCK: 100,
};
```

---

## 📚 References

- **NIST Fraud Prevention Framework**
- **OWASP API Security Top 10**
- **Telecom Fraud Best Practices**
- **Machine Learning for Fraud Detection**

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained By**: SIMShield 360 Security Team

