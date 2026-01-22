'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { PriceData, Price } from '@/lib/admin-data';

type PriceType = 'fixed' | 'range' | 'from' | 'tbd';

interface PriceFormData {
  modelId: string;
  issueId: string;
  type: PriceType;
  price: string;
  min: string;
  max: string;
  from: string;
  warrantyDays: string;
  eta: string;
  notes: string;
}

const defaultFormData: PriceFormData = {
  modelId: '',
  issueId: '',
  type: 'fixed',
  price: '',
  min: '',
  max: '',
  from: '',
  warrantyDays: '30',
  eta: '',
  notes: '',
};

export default function PricesManager() {
  const router = useRouter();
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<PriceFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterModel, setFilterModel] = useState('');
  const [filterIssue, setFilterIssue] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  function buildPricePayload() {
    const payload: Record<string, unknown> = {
      modelId: formData.modelId,
      issueId: formData.issueId,
      type: formData.type,
      warrantyDays: parseInt(formData.warrantyDays) || 0,
      eta: formData.eta,
      notes: formData.notes,
    };

    if (formData.type === 'fixed') {
      payload.price = parseFloat(formData.price) || 0;
    } else if (formData.type === 'range') {
      payload.min = parseFloat(formData.min) || 0;
      payload.max = parseFloat(formData.max) || 0;
    } else if (formData.type === 'from') {
      payload.from = parseFloat(formData.from) || 0;
    }

    return payload;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPricePayload()),
      });

      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error(json.error);
      }

      setData(json.data);
      setShowAdd(false);
      setFormData(defaultFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add price');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingKey) return;
    setSubmitting(true);
    setError('');

    const [modelId, issueId] = editingKey.split(':');

    try {
      const res = await fetch('/api/admin/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPricePayload(), modelId, issueId }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error(json.error);
      }

      setData(json.data);
      setEditingKey(null);
      setFormData(defaultFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update price');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(modelId: string, issueId: string) {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/prices?modelId=${modelId}&issueId=${issueId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error(json.error);
      }

      setData(json.data);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete price');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(price: Price) {
    setEditingKey(`${price.modelId}:${price.issueId}`);
    setFormData({
      modelId: price.modelId,
      issueId: price.issueId,
      type: price.type,
      price: price.price?.toString() || '',
      min: price.min?.toString() || '',
      max: price.max?.toString() || '',
      from: price.from?.toString() || '',
      warrantyDays: price.warrantyDays.toString(),
      eta: price.eta,
      notes: price.notes,
    });
    setShowAdd(false);
  }

  function cancelEdit() {
    setEditingKey(null);
    setFormData(defaultFormData);
  }

  function formatPrice(price: Price, currency: string): string {
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

  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [filterBrand, setFilterBrand] = useState('');

  const filteredPrices = data?.prices.filter((p) => {
    if (filterModel && p.modelId !== filterModel) return false;
    if (filterIssue && p.issueId !== filterIssue) return false;
    if (filterBrand) {
      const model = data?.models.find((m) => m.id === p.modelId);
      if (model?.brand !== filterBrand) return false;
    }
    return true;
  }) || [];

  // Group prices by brand
  const pricesByBrand = filteredPrices.reduce((acc, price) => {
    const model = data?.models.find((m) => m.id === price.modelId);
    const brandId = model?.brand || 'unknown';
    if (!acc[brandId]) {
      acc[brandId] = [];
    }
    acc[brandId].push(price);
    return acc;
  }, {} as Record<string, Price[]>);

  // Sort prices within each brand by model name then issue
  Object.keys(pricesByBrand).forEach((brandId) => {
    pricesByBrand[brandId].sort((a, b) => {
      const modelA = data?.models.find((m) => m.id === a.modelId)?.name || '';
      const modelB = data?.models.find((m) => m.id === b.modelId)?.name || '';
      if (modelA !== modelB) return modelA.localeCompare(modelB);
      return a.issueId.localeCompare(b.issueId);
    });
  });

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Prices</h1>
                <p className="text-sm text-gray-500">
                  {isLoggedIn ? 'Set prices for model + issue combinations' : 'View all prices'}
                </p>
              </div>
            </div>
            {!isLoggedIn && (
              <Link
                href="/admin/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Login to Edit
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filterBrand}
            onChange={(e) => {
              setFilterBrand(e.target.value);
              setFilterModel('');
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          >
            <option value="">All Brands</option>
            {data?.brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          >
            <option value="">All Models</option>
            {data?.models
              .filter((m) => !filterBrand || m.brand === filterBrand)
              .map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
          </select>
          <select
            value={filterIssue}
            onChange={(e) => setFilterIssue(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          >
            <option value="">All Issues</option>
            {data?.issues.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Collapse All
            </button>
          </div>
          {isLoggedIn && !showAdd && !editingKey && (
            <button
              onClick={() => setShowAdd(true)}
              className="ml-auto bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              + Add Price
            </button>
          )}
        </div>

        {/* Add/Edit Form - Only when logged in */}
        {isLoggedIn && (showAdd || editingKey) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {editingKey ? 'Edit Price' : 'Add New Price'}
            </h3>
            <form onSubmit={editingKey ? handleEdit : handleAdd} className="space-y-4">
              {!editingKey && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <select
                      value={formData.modelId}
                      onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    >
                      <option value="">Select model...</option>
                      {data?.models.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue</label>
                    <select
                      value={formData.issueId}
                      onChange={(e) => setFormData({ ...formData, issueId: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    >
                      <option value="">Select issue...</option>
                      {data?.issues.map((i) => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PriceType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="range">Range</option>
                    <option value="from">From</option>
                    <option value="tbd">TBD</option>
                  </select>
                </div>

                {formData.type === 'fixed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ({data?.currency})</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                  </div>
                )}

                {formData.type === 'range' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min ({data?.currency})</label>
                      <input
                        type="number"
                        value={formData.min}
                        onChange={(e) => setFormData({ ...formData, min: e.target.value })}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max ({data?.currency})</label>
                      <input
                        type="number"
                        value={formData.max}
                        onChange={(e) => setFormData({ ...formData, max: e.target.value })}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </>
                )}

                {formData.type === 'from' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From ({data?.currency})</label>
                    <input
                      type="number"
                      value={formData.from}
                      onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty (days)</label>
                  <input
                    type="number"
                    value={formData.warrantyDays}
                    onChange={(e) => setFormData({ ...formData, warrantyDays: e.target.value })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ETA</label>
                  <input
                    type="text"
                    value={formData.eta}
                    onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                    placeholder="e.g., 30-60 min"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional info..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingKey ? 'Save' : 'Add Price'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(false);
                    cancelEdit();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Prices List - Grouped by Brand */}
        <div className="space-y-4">
          {filteredPrices.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              {data?.prices.length === 0
                ? 'No prices found.'
                : 'No prices match the current filters.'}
            </div>
          ) : (
            data?.brands
              .filter((brand) => pricesByBrand[brand.id]?.length > 0)
              .map((brand) => {
                const brandPrices = pricesByBrand[brand.id] || [];
                const isExpanded = expandedBrands.has(brand.id);

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
                        <span className="text-sm text-gray-500">({brandPrices.length} prices)</span>
                      </div>
                    </button>

                    {/* Brand Prices Table */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-t">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Model</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Issue</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Type</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Price</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Warranty</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">ETA</th>
                              {isLoggedIn && (
                                <th className="px-4 py-2 text-right font-medium text-gray-600">Actions</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {brandPrices.map((price) => {
                              const key = `${price.modelId}:${price.issueId}`;
                              const model = data?.models.find((m) => m.id === price.modelId);
                              const issue = data?.issues.find((i) => i.id === price.issueId);

                              return (
                                <tr key={key} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 font-medium text-gray-900">{model?.name || price.modelId}</td>
                                  <td className="px-4 py-2 text-gray-600">{issue?.name || price.issueId}</td>
                                  <td className="px-4 py-2">
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                      price.type === 'fixed' ? 'bg-green-100 text-green-700' :
                                      price.type === 'range' ? 'bg-blue-100 text-blue-700' :
                                      price.type === 'from' ? 'bg-purple-100 text-purple-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {price.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 font-medium text-gray-900">{formatPrice(price, data?.currency || 'MYR')}</td>
                                  <td className="px-4 py-2 text-gray-600">{price.warrantyDays}d</td>
                                  <td className="px-4 py-2 text-gray-600">{price.eta || '-'}</td>
                                  {isLoggedIn && (
                                    <td className="px-4 py-2 text-right">
                                      {deleteConfirm === key ? (
                                        <div className="flex items-center justify-end gap-2">
                                          <span className="text-xs text-red-600">Delete?</span>
                                          <button
                                            onClick={() => handleDelete(price.modelId, price.issueId)}
                                            disabled={submitting}
                                            className="text-red-600 hover:text-red-700 font-medium text-xs"
                                          >
                                            Yes
                                          </button>
                                          <button
                                            onClick={() => setDeleteConfirm(null)}
                                            className="text-gray-500 hover:text-gray-700 text-xs"
                                          >
                                            No
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-end gap-2">
                                          <button
                                            onClick={() => startEdit(price)}
                                            className="text-amber-600 hover:text-amber-700 text-xs font-medium"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => setDeleteConfirm(key)}
                                            className="text-red-600 hover:text-red-700 text-xs font-medium"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
