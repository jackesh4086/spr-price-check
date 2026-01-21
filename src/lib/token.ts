import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.QUOTE_TOKEN_SECRET || 'default-secret-key-change-in-production-32chars'
);

const TOKEN_TTL = 10 * 60; // 10 minutes in seconds

export interface QuoteTokenPayload {
  phone: string;
  modelId: string;
  issueId: string;
  iat: number;
  exp: number;
}

export async function createQuoteToken(
  phone: string,
  modelId: string,
  issueId: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({
    phone,
    modelId,
    issueId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_TTL)
    .sign(SECRET_KEY);

  return token;
}

export async function verifyQuoteToken(
  token: string
): Promise<{ valid: boolean; payload?: QuoteTokenPayload; error?: string }> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);

    return {
      valid: true,
      payload: payload as unknown as QuoteTokenPayload,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return { valid: false, error: 'Quote token has expired. Please verify again.' };
      }
    }
    return { valid: false, error: 'Invalid quote token.' };
  }
}
