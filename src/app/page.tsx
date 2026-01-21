'use client';

import { useRouter } from 'next/navigation';
import { StepBar } from '@/components/StepBar';
import { Card } from '@/components/Card';
import { getModels, getBrand } from '@/lib/quote';

export default function HomePage() {
  const router = useRouter();
  const models = getModels();
  const brand = getBrand();

  return (
    <div>
      <StepBar current={1} />

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{brand} Price Check</h1>
        <p className="text-gray-600">Select your iPhone model to get a repair quote</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {models.map((model) => (
          <Card key={model.id} onClick={() => router.push(`/issue?model=${model.id}`)} className="p-4">
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
    </div>
  );
}
