// Admin authentication - username/password with JWT session
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

const SECRET_KEY = new TextEncoder().encode(
  process.env.ADMIN_TOKEN_SECRET || process.env.QUOTE_TOKEN_SECRET || 'default-secret-key-change-in-production-32chars'
);

const TOKEN_TTL = 24 * 60 * 60; // 24 hours in seconds
const COOKIE_NAME = 'admin_token';

export interface AdminTokenPayload {
  username: string;
  iat: number;
  exp: number;
}

// Hash password with SHA-256
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Verify admin credentials
export function verifyCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error('ADMIN_USERNAME or ADMIN_PASSWORD not configured');
    return false;
  }

  // Compare username (case-insensitive) and password hash
  const usernameMatch = username.toLowerCase() === adminUsername.toLowerCase();
  const passwordMatch = hashPassword(password) === hashPassword(adminPassword);

  return usernameMatch && passwordMatch;
}

// Create admin JWT token
export async function createAdminToken(username: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_TTL)
    .sign(SECRET_KEY);

  return token;
}

// Verify admin JWT token
export async function verifyAdminToken(
  token: string
): Promise<{ valid: boolean; payload?: AdminTokenPayload; error?: string }> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);

    return {
      valid: true,
      payload: payload as unknown as AdminTokenPayload,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return { valid: false, error: 'Session expired. Please login again.' };
      }
    }
    return { valid: false, error: 'Invalid session.' };
  }
}

// Set admin token in cookie
export async function setAdminCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_TTL,
    path: '/',
  });
}

// Clear admin token cookie
export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Get admin token from cookie
export async function getAdminTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value || null;
}

// Check if current request is authenticated
export async function isAuthenticated(): Promise<{ authenticated: boolean; username?: string }> {
  const token = await getAdminTokenFromCookie();
  if (!token) {
    return { authenticated: false };
  }

  const result = await verifyAdminToken(token);
  if (!result.valid || !result.payload) {
    return { authenticated: false };
  }

  return { authenticated: true, username: result.payload.username };
}

// Middleware helper to require authentication for API routes
export async function requireAuth(): Promise<{ authenticated: true; username: string } | { authenticated: false; error: string }> {
  const token = await getAdminTokenFromCookie();
  if (!token) {
    return { authenticated: false, error: 'Not authenticated' };
  }

  const result = await verifyAdminToken(token);
  if (!result.valid || !result.payload) {
    return { authenticated: false, error: result.error || 'Invalid session' };
  }

  return { authenticated: true, username: result.payload.username };
}
