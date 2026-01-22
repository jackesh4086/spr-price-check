import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';

// Check authentication status
export async function GET() {
  const auth = await isAuthenticated();
  return NextResponse.json({
    authenticated: auth.authenticated,
    username: auth.username || null,
  });
}
