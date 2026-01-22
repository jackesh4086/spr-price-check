'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { PriceData } from '@/lib/admin-data';

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [filterBrand, setFilterBrand] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [dataRes, authRes] = await Promise.all([
        fetch('/api/admin/data'),
        fetch('/api/admin/auth'),
      ]);

      if (dataRes.ok) {
        const json = await dataRes.json();
        setData(json);
      } else {
        throw new Error('Failed to fetch data');
      }

      if (authRes.ok) {
        const auth = await authRes.json();
        setIsLoggedIn(auth.authenticated);
        setUsername(auth.username);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setUsername(null);
    router.refresh();
  }

  function formatPrice(price: PriceData['prices'][0], currency: string): string {
    switch (price.type) {
      case 'fixed':
        return price.price === 0 ? 'FREE' : `${currency} ${price.price}`;
      case 'range':
        return `${currency} ${price.min} - ${price.max}`;
      case 'from':
        return `From ${currency} ${price.from}`;
      case 'tbd':
        return 'TBD';
      default:
        return '-';
    }
  }

  const toggleBrand = (brandId: string) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brandId)) {
        next.delete(brandId);
      } else {
        next.add(brandId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (data?.brands) {
      setExpandedBrands(new Set(data.brands.map((b) => b.id)));
    }
  };

  const collapseAll = () => {
    setExpandedBrands(new Set());
  };

  // Get models filtered by brand (sorted by name)
  const getModelsByBrand = (brandId: string) => {
    return (data?.models.filter((m) => m.brand === brandId) || [])
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get filtered brands
  const filteredBrands = data?.brands.filter((b) => {
    if (filterBrand && b.id !== filterBrand) return false;
    return getModelsByBrand(b.id).length > 0;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 text-red-600 font-medium hover:text-red-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">SPR Price List</h1>
            {isLoggedIn && (
              <p className="text-sm text-gray-500">Logged in as {username}</p>
            )}
          </div>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/admin/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Login to Edit
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Models</p>
            <p className="text-3xl font-bold text-gray-900">{data?.models.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Issues</p>
            <p className="text-3xl font-bold text-gray-900">{data?.issues.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Prices</p>
            <p className="text-3xl font-bold text-gray-900">{data?.prices.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Currency</p>
            <p className="text-3xl font-bold text-gray-900">{data?.currency || '-'}</p>
          </div>
        </div>

        {/* Navigation Cards - Only show when logged in */}
        {isLoggedIn && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/admin/models" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Models</h3>
                  <p className="text-sm text-gray-500">Add, edit, or remove phone models</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/issues" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Issues</h3>
                  <p className="text-sm text-gray-500">Add, edit, or remove repair issues</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/prices" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Prices</h3>
                  <p className="text-sm text-gray-500">Set prices for model + issue combinations</p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Price Matrix - Grouped by Brand */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">Price Matrix</h2>
              <p className="text-sm text-gray-500">Overview of all model × issue prices</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Brands</option>
                {data?.brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <button
                onClick={expandAll}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredBrands.map((brand) => {
            const brandModels = getModelsByBrand(brand.id);
            const isExpanded = expandedBrands.has(brand.id);
            const priceCount = brandModels.reduce((count, model) => {
              return count + data!.prices.filter((p) => p.modelId === model.id).length;
            }, 0);

            return (
              <div key={brand.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Brand Header */}
                <button
                  onClick={() => toggleBrand(brand.id)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-semibold text-gray-900">{brand.name}</span>
                    <span className="text-sm text-gray-500">
                      ({brandModels.length} models, {priceCount} prices)
                    </span>
                  </div>
                </button>

                {/* Brand Matrix Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-t">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-600 whitespace-nowrap">Model</th>
                          {data?.issues.map((issue) => (
                            <th key={issue.id} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap text-xs">
                              {issue.name.replace(' Replacement', '').replace(' (Mainboard/Water)', '')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {brandModels.map((model) => (
                          <tr key={model.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{model.name}</td>
                            {data?.issues.map((issue) => {
                              const price = data.prices.find(
                                (p) => p.modelId === model.id && p.issueId === issue.id
                              );
                              return (
                                <td key={issue.id} className="px-3 py-2 text-gray-600 whitespace-nowrap text-xs">
                                  {price ? (
                                    <span className={`${
                                      price.type === 'tbd' ? 'text-orange-500' :
                                      price.price === 0 ? 'text-green-600' : ''
                                    }`}>
                                      {formatPrice(price, data.currency)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
