'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { StepBar } from '@/components/StepBar';
import { Card, ErrorBox } from '@/components/Card';
import { getModels, getIssues, getBrandById } from '@/lib/quote';

function IssueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const brandId = searchParams.get('brand');
  const modelId = searchParams.get('model');

  const models = getModels();
  const issues = getIssues();
  const model = models.find((m) => m.id === modelId);
  const brand = brandId ? getBrandById(brandId) : null;

  if (!brandId || !brand) {
    return (
      <div>
        <StepBar current={3} />
        <ErrorBox message="No brand selected." onRetry={() => router.push('/')} />
      </div>
    );
  }

  if (!model) {
    return (
      <div>
        <StepBar current={3} />
        <ErrorBox message="No model selected." onRetry={() => router.push(`/model?brand=${brandId}`)} />
      </div>
    );
  }

  return (
    <div>
      <StepBar current={3} />

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">What Needs Repair?</h1>
        <p className="text-gray-600">{brand.name} {model.name} - Select the issue</p>
      </div>

      <div className="space-y-3">
        {issues.map((issue) => (
          <Card key={issue.id} onClick={() => router.push(`/auth?brand=${brandId}&model=${modelId}&issue=${issue.id}`)} className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5m-7-7l5 5m-5-5v5h5" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{issue.name}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        ))}
      </div>

      <button onClick={() => router.push(`/model?brand=${brandId}`)} className="mt-6 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
    </div>
  );
}

export default function IssuePage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <IssueContent />
    </Suspense>
  );
}
