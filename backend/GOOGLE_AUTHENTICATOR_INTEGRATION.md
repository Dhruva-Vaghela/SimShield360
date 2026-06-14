# Google Authenticator Integration Guide

## Overview
Google Authenticator is now the primary identity verification layer (Layer 3) in SIMShield 360.

## Backend Implementation

### API Endpoints

#### 1. Setup Authenticator
```
POST /api/verification/authenticator/setup
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
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

#### 2. Enable Authenticator
```
POST /api/verification/authenticator/enable
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "secret": "JBSWY3DPEHPK3PXP",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "backupCodes": ["abc123def456", "..."],
    "message": "Google Authenticator configured successfully"
  }
}
```

#### 3. Get Status
```
GET /api/verification/authenticator/status
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isConfigured": true,
    "status": "Configured"
  }
}
```

#### 4. Verify Code (During SIM Swap)
```
POST /api/verification/authenticator
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "requestId": "uuid-of-swap-request",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Authenticator code verified successfully"
  }
}
```

#### 5. Disable Authenticator
```
POST /api/verification/authenticator/disable
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "code": "123456"
}
```

## Frontend Integration Requirements

### Customer Dashboard - Security Settings

```typescript
interface AuthenticatorStatus {
  isConfigured: boolean;
  status: 'Configured' | 'Not Configured';
}

interface SetupResponse {
  secret: string;
  qrCodeUrl: string; // base64 data URL
  message: string;
}
```

### UI Flow

#### 1. Security Settings Page
```
┌─────────────────────────────────────┐
│  Security Settings                  │
├─────────────────────────────────────┤
│                                     │
│  Google Authenticator               │
│  Status: [Configured / Not Config]  │
│                                     │
│  [Setup Authenticator]              │
│  [Reconfigure Authenticator]        │
│  [Disable Authenticator]            │
│                                     │
└─────────────────────────────────────┘
```

#### 2. Setup Flow
```
Step 1: Click "Setup Authenticator"
  ↓
Step 2: Call GET /api/verification/authenticator/setup
  ↓
Step 3: Display QR Code (from qrCodeUrl)
  ↓
Step 4: User scans QR code with Google Authenticator app
  ↓
Step 5: User enters 6-digit code
  ↓
Step 6: Call POST /api/verification/authenticator/enable
  ↓
Step 7: Display backup codes (save securely)
  ↓
Step 8: Status changes to "Configured"
```

#### 3. SIM Swap Verification Flow (Layer 3)
```
When swap request reaches Layer 3:
  ↓
Display: "Enter 6-digit Google Authenticator Code"
  ↓
User enters code
  ↓
Call: POST /api/verification/authenticator
  ↓
If valid → Proceed to Layer 4
If invalid → Show error, allow retry
```

### Sample React Component Structure

```tsx
// AuthenticatorSetup.tsx
function AuthenticatorSetup() {
  const [step, setStep] = useState<'initial' | 'qrcode' | 'verify' | 'complete'>('initial');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const handleSetup = async () => {
    const response = await fetch('/api/verification/authenticator/setup', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setSecret(data.data.secret);
    setQrCodeUrl(data.data.qrCodeUrl);
    setStep('qrcode');
  };

  const handleEnable = async () => {
    const response = await fetch('/api/verification/authenticator/enable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ secret, code })
    });
    const data = await response.json();
    setBackupCodes(data.data.backupCodes);
    setStep('complete');
  };

  // ... render based on step
}
```

## Face Verification (Layer 2) - Simulation

### API Endpoint
```
POST /api/verification/face
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "requestId": "uuid-of-swap-request",
  "simulationResult": "match" | "no_match"
}
```

### UI Implementation
```
┌───────────────────────────────────┐
│  Face Verification (Layer 2)      │
├───────────────────────────────────┤
│                                   │
│  For simulation purposes:         │
│                                   │
│  [✓ Match Face]                   │
│  Returns: confidence 96%          │
│  Action: Proceeds to Layer 3      │
│                                   │
│  [✗ Not Match Face]               │
│  Returns: confidence 42%          │
│  Action: Blocks workflow          │
│                                   │
└───────────────────────────────────┘
```

## Security Notes

1. **Secret Storage**: The TOTP secret is encrypted before storage in the database
2. **Backup Codes**: Generated during setup, can be used if authenticator is lost
3. **Time Window**: TOTP codes have a 30-second window with 1-step tolerance (30 seconds before/after)
4. **Audit Trail**: All authenticator operations are logged

## Testing

### Manual Test Flow
1. Register/Login as customer
2. Navigate to Security Settings
3. Click "Setup Authenticator"
4. Scan QR code with Google Authenticator mobile app
5. Enter generated 6-digit code
6. Save backup codes
7. Initiate SIM swap request
8. Enter current Google Authenticator code at Layer 3
9. Verify successful progression

### Test Credentials
- Use Google Authenticator app (iOS/Android)
- Or use compatible TOTP apps: Authy, Microsoft Authenticator, etc.
