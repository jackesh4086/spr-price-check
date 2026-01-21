'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StepBar } from '@/components/StepBar';
import { Card, Spinner, ErrorBox } from '@/components/Card';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelId = searchParams.get('model');
  const issueId = searchParams.get('issue');
  const phone = searchParams.get('phone');

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number>();
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  if (!modelId || !issueId || !phone) {
    return (
      <div>
        <StepBar current={3} />
        <ErrorBox message="Missing data." onRetry={() => router.push('/')} />
      </div>
    );
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    if (value.length > 1) {
      const digits = value.slice(0, 6).split('');
      digits.forEach((d, i) => { if (index + i < 6) newCode[index + i] = d; });
      setCode(newCode);
      inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
    } else {
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) { setError('Enter 6-digit code'); return; }

    setError(null);
    setRetryAfter(undefined);
    setLoading(true);

    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: fullCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setRetryAfter(data.retryAfter);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      router.push(`/quote?token=${data.quoteToken}`);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, modelId, issueId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        if (data.retryAfter) setResendCooldown(data.retryAfter);
        return;
      }

      setResendCooldown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const masked = phone.length > 8 ? phone.slice(0, -8) + '****' + phone.slice(-4) : phone;

  return (
    <div>
      <StepBar current={3} />

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter Code</h1>
        <p className="text-gray-600">Sent to {masked}</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={loading}
              />
            ))}
          </div>

          {error && <div className="mb-4"><ErrorBox message={error} retryAfter={retryAfter} /></div>}

          <button
            type="submit"
            disabled={loading || code.some((d) => !d)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner size="sm" /> Verifying...</> : 'Verify'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleResend}
            disabled={loading || resendCooldown > 0}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:text-gray-400"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
        </div>
      </Card>

      <button onClick={() => router.push(`/auth?model=${modelId}&issue=${issueId}`)} className="mt-6 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Change number
      </button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
