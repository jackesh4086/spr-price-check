'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { StepBar } from '@/components/StepBar';
import { Card, ErrorBox } from '@/components/Card';
import { getModelsByBrand, getBrandById } from '@/lib/quote';

function ModelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const brandId = searchParams.get('brand');

  if (!brandId) {
    return (
      <div>
        <StepBar current={2} />
        <ErrorBox message="No brand selected." onRetry={() => router.push('/')} />
      </div>
    );
  }

  const brand = getBrandById(brandId);
  const models = getModelsByBrand(brandId);

  if (!brand) {
    return (
      <div>
        <StepBar current={2} />
        <ErrorBox message="Invalid brand selected." onRetry={() => router.push('/')} />
      </div>
    );
  }

  return (
    <div>
      <StepBar current={2} />

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Your Model</h1>
        <p className="text-gray-600">{brand.name} - Choose your phone model</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {models.map((model) => (
          <Card key={model.id} onClick={() => router.push(`/issue?brand=${brandId}&model=${model.id}`)} className="p-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-medium text-gray-900 text-sm">{model.name}</p>
            </div>
          </Card>
        ))}
      </div>

      <button onClick={() => router.push('/')} className="mt-6 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
    </div>
  );
}

export default function ModelPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <ModelContent />
    </Suspense>
  );
}
