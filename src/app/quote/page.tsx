'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StepBar } from '@/components/StepBar';
import { Card, Spinner, ErrorBox } from '@/components/Card';

interface PriceInfo {
  type: 'fixed' | 'range' | 'from' | 'tbd';
  price?: number;
  min?: number;
  max?: number;
  from?: number;
  warrantyDays: number;
  eta: string;
  notes: string;
}

interface QuoteData {
  brand: string;
  model: { id: string; name: string };
  issue: { id: string; name: string };
  pricing: PriceInfo;
  currency: string;
  disclaimer: string;
  whatsappNumber: string;
  validUntil: string;
  phone: string;
}

function formatPrice(pricing: PriceInfo, currency: string): string {
  switch (pricing.type) {
    case 'fixed':
      return pricing.price === 0 ? 'FREE' : `${currency} ${pricing.price}`;
    case 'range':
      return `${currency} ${pricing.min} - ${pricing.max}`;
    case 'from':
      return `From ${currency} ${pricing.from}`;
    case 'tbd':
      return 'Price TBD';
    default:
      return 'Contact for quote';
  }
}

function QuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No token. Complete verification first.');
      setLoading(false);
      return;
    }

    fetch(`/api/quote?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setQuote(data.quote);
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div>
        <StepBar current={4} />
        <div className="flex flex-col items-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div>
        <StepBar current={4} />
        <ErrorBox message={error || 'Unable to load quote'} onRetry={() => router.push('/')} />
        <button onClick={() => router.push('/')} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
          Start New Quote
        </button>
      </div>
    );
  }

  const validTime = new Date(quote.validUntil).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const whatsappMessage = encodeURIComponent(
    `Hi ${quote.brand}, I'd like to enquire about ${quote.issue.name} for my ${quote.model.name}. Quote reference: ${quote.phone}`
  );
  const whatsappUrl = `https://wa.me/${quote.whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div>
      <StepBar current={4} />

      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Repair Quote</h1>
        <p className="text-gray-600">Verified for {quote.phone}</p>
      </div>

      <Card className="mb-6 p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start pb-4 border-b border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Device</p>
              <p className="font-medium text-gray-900">{quote.model.name}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="pb-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">Repair Type</p>
            <p className="font-medium text-gray-900">{quote.issue.name}</p>
          </div>

          <div className="pb-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">Estimated Cost</p>
            <p className="text-3xl font-bold text-gray-900">{formatPrice(quote.pricing, quote.currency)}</p>
            {quote.pricing.notes && (
              <p className="text-sm text-gray-500 mt-1">{quote.pricing.notes}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">ETA</p>
              <p className="font-medium text-gray-900">{quote.pricing.eta}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Warranty</p>
              <p className="font-medium text-gray-900">
                {quote.pricing.warrantyDays > 0 ? `${quote.pricing.warrantyDays} days` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-amber-50 border-amber-100 p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-amber-800">{quote.disclaimer}</p>
        </div>
      </Card>

      <Card className="bg-blue-50 border-blue-100 p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-800">Quote valid until <strong>{validTime}</strong></p>
        </div>
      </Card>

      <div className="space-y-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Chat on WhatsApp
        </a>
        <button onClick={() => router.push('/stores')} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
          Find Nearby Stores
        </button>
        <button onClick={() => router.push('/')} className="w-full bg-white text-gray-700 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50">
          Get Another Quote
        </button>
      </div>
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <QuoteContent />
    </Suspense>
  );
}
