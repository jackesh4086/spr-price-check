import crypto from "crypto";
import { kvGet, kvSet, kvDel, OTPRecord } from './store';

const OTP_TTL = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

const otpKey = (phone: string) => `otp:${phone}`;

export function genOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function storeOTP(
  phone: string,
  code: string,
  modelId: string,
  issueId: string
): Promise<{ success: boolean; error?: string; retryAfter?: number }> {
  const now = Date.now();
  const existing = await kvGet<OTPRecord>(otpKey(phone));

  // Check if locked out
  if (existing?.lockedUntil && now < existing.lockedUntil) {
    const retryAfter = Math.ceil((existing.lockedUntil - now) / 1000);
    return { success: false, error: 'Too many failed attempts. Please try again later.', retryAfter };
  }

  // Check resend cooldown
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN) {
    const retryAfter = Math.ceil((RESEND_COOLDOWN - (now - existing.lastSentAt)) / 1000);
    return { success: false, error: 'Please wait before requesting a new code.', retryAfter };
  }

  const record: OTPRecord = {
    hashedCode: hashOtp(code),
    phone,
    modelId,
    issueId,
    expiresAt: now + OTP_TTL,
    attempts: 0,
    lockedUntil: null,
    lastSentAt: now,
  };

  await kvSet(otpKey(phone), record, OTP_TTL);
  return { success: true };
}

export async function verifyOTP(
  phone: string,
  code: string
): Promise<{ valid: boolean; error?: string; modelId?: string; issueId?: string; retryAfter?: number }> {
  const now = Date.now();
  const record = await kvGet<OTPRecord>(otpKey(phone));

  if (!record) {
    return { valid: false, error: 'No verification code found. Please request a new one.' };
  }

  // Check if locked out
  if (record.lockedUntil && now < record.lockedUntil) {
    const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
    return { valid: false, error: 'Too many failed attempts. Please try again later.', retryAfter };
  }

  // Check if expired
  if (now > record.expiresAt) {
    await kvDel(otpKey(phone));
    return { valid: false, error: 'Verification code has expired. Please request a new one.' };
  }

  // Check code
  const hashedInput = hashOtp(code);
  if (hashedInput !== record.hashedCode) {
    record.attempts++;

    // Lock after MAX_ATTEMPTS failed attempts
    if (record.attempts >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_DURATION;
      await kvSet(otpKey(phone), record, LOCKOUT_DURATION);
      const retryAfter = Math.ceil(LOCKOUT_DURATION / 1000);
      return { valid: false, error: 'Too many failed attempts. Account locked for 15 minutes.', retryAfter };
    }

    // Update attempts count
    const remainingTtl = record.expiresAt - now;
    await kvSet(otpKey(phone), record, remainingTtl);

    const remaining = MAX_ATTEMPTS - record.attempts;
    return { valid: false, error: `Invalid code. ${remaining} attempts remaining.` };
  }

  // Success - extract data and clean up
  const { modelId, issueId } = record;
  await kvDel(otpKey(phone));

  return { valid: true, modelId, issueId };
}
