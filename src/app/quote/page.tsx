'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading quote...</p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-red-500 mb-4">{error || 'Unable to load quote'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
        >
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-medium text-gray-800 mb-1">Your Repair Quote</h1>
          <p className="text-gray-600 text-sm">Verified for {quote.phone}</p>
        </div>

        <div className="border-2 border-gray-800 rounded-2xl p-6 mb-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Device</span>
              <span className="font-medium">{quote.model.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Repair</span>
              <span className="font-medium">{quote.issue.name}</span>
            </div>
            <div className="border-t pt-4">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Estimated Cost</p>
                <p className="text-3xl font-bold text-gray-900">{formatPrice(quote.pricing, quote.currency)}</p>
                {quote.pricing.notes && (
                  <p className="text-sm text-gray-500 mt-1">{quote.pricing.notes}</p>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ETA: {quote.pricing.eta}</span>
              <span className="text-gray-500">
                Warranty: {quote.pricing.warrantyDays > 0 ? `${quote.pricing.warrantyDays} days` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mb-4">
          Quote valid until {validTime}
        </p>

        <div className="space-y-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 flex items-center justify-center gap-2"
          >
            Chat on WhatsApp
          </a>
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-3 border-2 border-gray-800 text-gray-800 rounded-full font-medium hover:bg-gray-100"
          >
            Get Another Quote
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          {quote.disclaimer}
        </p>
      </div>
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <QuoteContent />
    </Suspense>
  );
}
