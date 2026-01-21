'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StepBar } from '@/components/StepBar';
import { Card, Spinner, ErrorBox } from '@/components/Card';
import { getModels, getIssues } from '@/lib/quote';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelId = searchParams.get('model');
  const issueId = searchParams.get('issue');

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number>();

  const models = getModels();
  const issues = getIssues();
  const model = models.find((m) => m.id === modelId);
  const issue = issues.find((i) => i.id === issueId);

  if (!model || !issue) {
    return (
      <div>
        <StepBar current={3} />
        <ErrorBox message="Missing selection." onRetry={() => router.push('/')} />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRetryAfter(undefined);
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
        setRetryAfter(data.retryAfter);
        return;
      }

      router.push(`/verify?model=${modelId}&issue=${issueId}&phone=${encodeURIComponent(phone)}`);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <StepBar current={3} />

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Phone</h1>
        <p className="text-gray-600">We&apos;ll send a code to your WhatsApp</p>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="font-medium">{model.name}</span>
          <span className="text-gray-300">|</span>
          <span>{issue.name}</span>
        </div>
      </Card>

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+60123456789"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500">Enter with country code</p>
          </div>

          {error && <div className="mb-4"><ErrorBox message={error} retryAfter={retryAfter} /></div>}

          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner size="sm" /> Sending...</> : 'Send Code'}
          </button>
        </form>
      </Card>

      <button onClick={() => router.push(`/issue?model=${modelId}`)} className="mt-6 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}
