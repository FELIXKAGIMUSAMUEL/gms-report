# Security Implementation Guide

## Overview
This document outlines the security measures implemented in the GMS Report system to protect user data, prevent unauthorized access, and maintain system integrity.

## Password Security

### Password Hashing
- **Algorithm**: bcrypt with 12 rounds (increased from 10)
- **Location**: All password storage and verification
- **Implementation**: See `src/lib/security.ts`

```typescript
import { hashPassword, comparePassword } from '@/lib/security';

// When creating/updating passwords
const hashedPassword = await hashPassword(newPassword);

// When verifying passwords
const isValid = await comparePassword(inputPassword, storedHash);
```

### Password Strength Requirements
All new passwords must meet the following criteria:
- Minimum 8 characters (12+ recommended for "strong" rating)
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*()_+-=[]{};\:'"|,.<>/?)

```typescript
import { validatePasswordStrength } from '@/lib/security';

const validation = validatePasswordStrength(password);
if (!validation.isValid) {
  // validation.errors contains list of issues
  // validation.strength: 'weak' | 'medium' | 'strong'
}
```

## Authentication Security

### Rate Limiting
Protects against brute force attacks:
- **Login attempts**: 5 attempts per 15 minutes per email
- **Account lockout**: 15 minutes after max attempts exceeded
- **Implementation**: In-memory store (consider Redis for production scaling)

```typescript
import { checkRateLimit, resetRateLimit } from '@/lib/security';

// Check if request is rate limited
const rateLimit = checkRateLimit(identifier, {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  lockoutDurationMs: 15 * 60 * 1000,
});

if (!rateLimit.allowed) {
  // Block request, show retry time
}

// Reset on successful authentication
resetRateLimit(identifier);
```

### Session Management
- **Strategy**: JWT (JSON Web Tokens)
- **Session duration**: 2 hours
- **Token refresh**: Every 10 minutes of activity
- **Storage**: HttpOnly cookies (handled by NextAuth)
- **Expiration validation**: Middleware checks token expiry on every request

## Security Headers

### HTTP Security Headers
Implemented via Next.js config and middleware:

1. **Strict-Transport-Security (HSTS)**
   - Forces HTTPS connections
   - `max-age=63072000; includeSubDomains; preload`

2. **X-Frame-Options**
   - Prevents clickjacking attacks
   - `SAMEORIGIN` - only allow framing from same origin

3. **X-Content-Type-Options**
   - Prevents MIME type sniffing
   - `nosniff`

4. **X-XSS-Protection**
   - Enables browser XSS filtering
   - `1; mode=block`

5. **Referrer-Policy**
   - Controls referrer information
   - `strict-origin-when-cross-origin`

6. **Permissions-Policy**
   - Restricts browser features
   - Disabled: camera, microphone, geolocation

## CSRF Protection

Cross-Site Request Forgery protection:
- **Method**: Origin/Referer header validation
- **Applied to**: All POST, PUT, DELETE, PATCH requests
- **Allowed origins**: Configured in environment (`NEXTAUTH_URL`)
- **Implementation**: `src/middleware.ts`

## Input Validation & Sanitization

### XSS Prevention
```typescript
import { sanitizeInput, sanitizeObject } from '@/lib/security';

// Sanitize single string
const clean = sanitizeInput(userInput);

// Sanitize entire object recursively
const cleanData = sanitizeObject(requestBody);
```

Sanitization replaces dangerous characters:
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&#x27;`
- `/` → `&#x2F;`

### Email Validation
```typescript
import { isValidEmail } from '@/lib/security';

if (!isValidEmail(email)) {
  return { error: 'Invalid email format' };
}
```

## API Route Protection

### Security Middleware
Wrapper for API routes with rate limiting and sanitization:

```typescript
import { withSecurity } from '@/lib/api-security';

export const POST = withSecurity(
  async (req) => {
    // Your handler code
  },
  {
    rateLimit: {
      maxAttempts: 10,
      windowMs: 60 * 1000, // 1 minute
    },
    sanitizeInput: true,
  }
);
```

### CORS Validation
```typescript
import { validateOrigin } from '@/lib/api-security';

if (!validateOrigin(req)) {
  return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
}
```

## Password Change Endpoint

Secure password change with validation:
- **Endpoint**: `POST /api/auth/change-password`
- **Authentication**: Required (session-based)
- **Validation**: 
  - Current password verification
  - New password strength check
  - No password reuse (implement if needed)

```typescript
// Request
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecureP@ss456"
}

// Success Response
{
  "success": true,
  "message": "Password changed successfully",
  "strength": "strong"
}

// Error Response
{
  "error": "New password does not meet security requirements",
  "details": [
    "Password must contain at least one special character"
  ],
  "strength": "weak"
}
```

## Environment Variables Security

### Required Variables
```env
# Strong random secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-here"

# Production URL (update for deployment)
NEXTAUTH_URL="http://localhost:3003"

# Database URL (use connection pooling in production)
DATABASE_URL="postgresql://user:pass@localhost:5432/gms_report"
```

### Best Practices
- Never commit `.env` to version control
- Use different secrets for dev/staging/production
- Rotate secrets periodically
- Use environment-specific URLs
- Enable SSL for database connections in production

## Production Deployment Checklist

- [ ] Change default passwords in seed data
- [ ] Set strong `NEXTAUTH_SECRET` (32+ random characters)
- [ ] Enable HTTPS (required for HSTS and secure cookies)
- [ ] Configure production `NEXTAUTH_URL`
- [ ] Set up Redis for rate limiting (for multi-server deployments)
- [ ] Enable database connection pooling (PgBouncer)
- [ ] Configure Content Security Policy (CSP)
- [ ] Set up automated security scanning
- [ ] Enable audit logging for sensitive operations
- [ ] Configure backup encryption
- [ ] Review and test all security headers
- [ ] Set up monitoring for suspicious login attempts
- [ ] Configure firewall rules
- [ ] Enable 2FA for admin accounts (future enhancement)

## Security Monitoring

### Recommended Monitoring
1. **Failed login attempts**
   - Track repeated failures from same IP/email
   - Alert on unusual patterns

2. **Rate limit triggers**
   - Log all rate limit blocks
   - Identify potential attacks

3. **Session anomalies**
   - Unusual session durations
   - Token expiration patterns
   - Concurrent sessions from different IPs

4. **API abuse**
   - Unusual request patterns
   - Large file uploads
   - Excessive data exports

## Future Enhancements

### Recommended Additions
1. **Two-Factor Authentication (2FA)**
   - TOTP-based authentication
   - SMS backup codes
   - Recovery codes

2. **Advanced Rate Limiting**
   - Redis-based distributed rate limiting
   - Per-endpoint custom limits
   - Adaptive rate limiting based on threat level

3. **Security Audit Log**
   - Log all authentication events
   - Track sensitive data access
   - Maintain audit trail for compliance

4. **Password History**
   - Prevent password reuse
   - Force periodic password changes
   - Track password change history

5. **IP Whitelisting**
   - Restrict admin access by IP
   - Country-based blocking
   - VPN detection

6. **Content Security Policy (CSP)**
   - Restrict script sources
   - Prevent inline script execution
   - Report violations

7. **Automated Vulnerability Scanning**
   - Dependency scanning (npm audit)
   - SAST/DAST tools
   - Regular penetration testing

## Security Contact

For security issues or vulnerabilities, please contact:
- Email: security@sirapollokaggwa.com
- DO NOT post security issues publicly

## Updates

This security implementation is current as of February 2026. Review and update security measures regularly as new threats emerge and best practices evolve.
