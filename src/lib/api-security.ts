/**
 * API Route Security Middleware
 * Provides rate limiting and input validation for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, sanitizeObject } from '@/lib/security';

export interface SecurityConfig {
  rateLimit?: {
    maxAttempts: number;
    windowMs: number;
    lockoutDurationMs?: number;
  };
  sanitizeInput?: boolean;
  requireAuth?: boolean;
}

/**
 * Apply security middleware to API route
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Apply rate limiting if configured
      if (config.rateLimit) {
        const identifier = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
        const rateLimit = checkRateLimit(identifier, config.rateLimit);
        
        if (!rateLimit.allowed) {
          return NextResponse.json(
            {
              error: 'Too many requests',
              retryAfter: rateLimit.retryAfter,
            },
            {
              status: 429,
              headers: {
                'Retry-After': String(rateLimit.retryAfter || 60),
              },
            }
          );
        }
      }

      // Sanitize input if configured
      if (config.sanitizeInput && req.method !== 'GET') {
        try {
          const body = await req.json();
          const sanitized = sanitizeObject(body);
          
          // Create new request with sanitized body
          const sanitizedReq = new NextRequest(req.url, {
            method: req.method,
            headers: req.headers,
            body: JSON.stringify(sanitized),
          });
          
          return handler(sanitizedReq);
        } catch {
          // If body is not JSON, continue with original request
          return handler(req);
        }
      }

      return handler(req);
    } catch (error) {
      console.error('Security middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Validate request origin for CSRF protection
 */
export function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  if (!origin && !referer) {
    // Allow requests without origin/referer (e.g., API clients)
    return true;
  }
  
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    'http://localhost:3003',
    'http://localhost:3000',
  ].filter(Boolean);
  
  const requestOrigin = origin || referer;
  
  return allowedOrigins.some(allowed => 
    requestOrigin?.startsWith(allowed || '')
  );
}

/**
 * Get client IP address
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.ip ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
