// Input sanitization utilities

export function normalizeMsisdn(input: string): string {
  const digits = (input || "").replace(/[^\d]/g, "");
  // Malaysia: allow formats like 01x..., +601x..., 601x...
  if (digits.startsWith("0")) return "6" + digits; // 0xxxxxxxxx -> 60xxxxxxxxx
  if (digits.startsWith("60")) return digits;
  if (digits.startsWith("6")) return digits;
  // fallback: treat as local
  return "60" + digits;
}

export function isValidMsisdn(msisdn: string): boolean {
  // basic MY validation: 60 + 9~10 digits (rough)
  if (!msisdn.startsWith("60")) return false;
  const rest = msisdn.slice(2);
  return rest.length >= 9 && rest.length <= 10;
}

export function validateOTPCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  const start = phone.slice(0, -8);
  const end = phone.slice(-4);
  return `${start}****${end}`;
}

export function sanitizeModelId(id: string): string {
  return id.replace(/[^a-zA-Z0-9\-_]/g, '');
}

export function sanitizeIssueId(id: string): string {
  return id.replace(/[^a-zA-Z0-9\-_]/g, '');
}
