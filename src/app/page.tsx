'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrands, getModelsByBrand, getIssues } from '@/lib/quote';

export default function HomePage() {
  const router = useRouter();
  const brands = getBrands();
  const issues = getIssues();

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const models = selectedBrand ? getModelsByBrand(selectedBrand) : [];

  const handleBrandChange = (brandId: string) => {
    setSelectedBrand(brandId);
    setSelectedModel('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBrand || !selectedModel || !selectedIssue || !phone) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, modelId: selectedModel, issueId: selectedIssue }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push(`/verify?brand=${selectedBrand}&model=${selectedModel}&issue=${selectedIssue}&phone=${encodeURIComponent(phone)}`);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">SPR Price Check</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <select
          value={selectedBrand}
          onChange={(e) => handleBrandChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-800 rounded-full bg-white text-center text-gray-700 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
        >
          <option value="">Select Brand</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>

        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={!selectedBrand}
          className="w-full px-4 py-3 border-2 border-gray-800 rounded-full bg-white text-center text-gray-700 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-400"
        >
          <option value="">Select Model</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>{model.name}</option>
          ))}
        </select>

        <select
          value={selectedIssue}
          onChange={(e) => setSelectedIssue(e.target.value)}
          disabled={!selectedModel}
          className="w-full px-4 py-3 border-2 border-gray-800 rounded-full bg-white text-center text-gray-700 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-400"
        >
          <option value="">Repair Issue</option>
          {issues.map((issue) => (
            <option key={issue.id} value={issue.id}>{issue.name}</option>
          ))}
        </select>

        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          disabled={!selectedIssue}
          className="w-full px-4 py-3 border-2 border-gray-800 rounded-full bg-white text-center text-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-400"
        />

        {error && (
          <p className="text-red-500 text-center text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !selectedBrand || !selectedModel || !selectedIssue || !phone}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : 'Get Quote'}
        </button>
      </form>
    </div>
  );
}
