import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';
import { createQuoteToken } from '@/lib/token';
import { normalizeMsisdn, validateOTPCode } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required.' }, { status: 400 });
    }

    if (!validateOTPCode(code)) {
      return NextResponse.json({ error: 'Code must be 6 digits.' }, { status: 400 });
    }

    const msisdn = normalizeMsisdn(phone);
    const result = await verifyOTP(msisdn, code);

    if (!result.valid) {
      const status = result.retryAfter ? 429 : 400;
      return NextResponse.json({ error: result.error, retryAfter: result.retryAfter }, { status });
    }

    const quoteToken = await createQuoteToken(msisdn, result.modelId!, result.issueId!);

    const response = NextResponse.json({ success: true, quoteToken });

    response.cookies.set('quoteToken', quoteToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
