'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { PriceData, Model } from '@/lib/admin-data';

export default function ModelsManager() {
  const router = useRouter();
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ id: '', name: '', brand: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [filterBrand, setFilterBrand] = useState('');

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

  const getModelsByBrand = (brandId: string) => {
    return (data?.models.filter((m) => m.brand === brandId) || [])
      .sort((a, b) => a.name.localeCompare(b.name));
  };

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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
      setFormData({ id: '', name: '', brand: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add model');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/models/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, brand: formData.brand, newId: formData.id !== editingId ? formData.id : undefined }),
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
      setEditingId(null);
      setFormData({ id: '', name: '', brand: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update model');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/models/${id}`, { method: 'DELETE' });
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
      setError(err instanceof Error ? err.message : 'Failed to delete model');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(model: Model) {
    setEditingId(model.id);
    setFormData({ id: model.id, name: model.name, brand: model.brand });
    setShowAdd(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({ id: '', name: '', brand: '' });
  }

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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Phone Models</h1>
                <p className="text-sm text-gray-500">
                  {isLoggedIn ? 'Add, edit, or remove phone models' : 'View all phone models'}
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Brands</option>
            {data?.brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
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
          {isLoggedIn && !showAdd && !editingId && (
            <button
              onClick={() => setShowAdd(true)}
              className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + Add Model
            </button>
          )}
        </div>

        {/* Add Form */}
        {isLoggedIn && showAdd && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add New Model</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select brand...</option>
                    {data?.brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    required
                    placeholder="e.g., ip16"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., iPhone 16"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Model'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setFormData({ id: '', name: '', brand: '' }); }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Models List - Grouped by Brand */}
        <div className="space-y-4">
          {data?.brands
            .filter((brand) => !filterBrand || brand.id === filterBrand)
            .filter((brand) => getModelsByBrand(brand.id).length > 0)
            .map((brand) => {
              const brandModels = getModelsByBrand(brand.id);
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
                      <span className="text-sm text-gray-500">({brandModels.length} models)</span>
                    </div>
                  </button>

                  {/* Brand Models Table */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-t">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">ID</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Name</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Prices</th>
                            {isLoggedIn && (
                              <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {brandModels.map((model) => {
                            const priceCount = data.prices.filter((p) => p.modelId === model.id).length;
                            const isEditing = editingId === model.id;

                            if (isEditing && isLoggedIn) {
                              return (
                                <tr key={model.id} className="bg-blue-50">
                                  <td colSpan={4} className="px-4 py-4">
                                    <form onSubmit={handleEdit} className="space-y-4">
                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                          <select
                                            value={formData.brand}
                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                          >
                                            {data?.brands.map((b) => (
                                              <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                                          <input
                                            type="text"
                                            value={formData.id}
                                            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                          <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          type="submit"
                                          disabled={submitting}
                                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                                        >
                                          {submitting ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={cancelEdit}
                                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </form>
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr key={model.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm font-mono text-gray-600">{model.id}</td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{model.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{priceCount} prices</td>
                                {isLoggedIn && (
                                  <td className="px-4 py-2 text-right">
                                    {deleteConfirm === model.id ? (
                                      <div className="flex items-center justify-end gap-2">
                                        <span className="text-xs text-red-600">Delete?</span>
                                        <button
                                          onClick={() => handleDelete(model.id)}
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
                                          onClick={() => startEdit(model)}
                                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => setDeleteConfirm(model.id)}
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
            })}
          {(!data?.models || data.models.length === 0) && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No models found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
