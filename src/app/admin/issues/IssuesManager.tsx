'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { PriceData, Issue } from '@/lib/admin-data';

export default function IssuesManager() {
  const router = useRouter();
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/issues', {
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
      setFormData({ id: '', name: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add issue');
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
      const res = await fetch(`/api/admin/issues/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, newId: formData.id !== editingId ? formData.id : undefined }),
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
      setFormData({ id: '', name: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update issue');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/issues/${id}`, { method: 'DELETE' });
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
      setError(err instanceof Error ? err.message : 'Failed to delete issue');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(issue: Issue) {
    setEditingId(issue.id);
    setFormData({ id: issue.id, name: issue.name });
    setShowAdd(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({ id: '', name: '' });
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
                <h1 className="text-xl font-bold text-gray-900">Repair Issues</h1>
                <p className="text-sm text-gray-500">
                  {isLoggedIn ? 'Add, edit, or remove repair issues' : 'View all repair issues'}
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

        {/* Add Button - Only when logged in */}
        {isLoggedIn && !showAdd && !editingId && (
          <button
            onClick={() => setShowAdd(true)}
            className="mb-6 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            + Add Issue
          </button>
        )}

        {/* Add Form */}
        {isLoggedIn && showAdd && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add New Issue</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    required
                    placeholder="e.g., speaker"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Speaker Repair"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Issue'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setFormData({ id: '', name: '' }); }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Issues List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Prices</th>
                {isLoggedIn && (
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.issues.map((issue) => {
                const priceCount = data.prices.filter((p) => p.issueId === issue.id).length;
                const isEditing = editingId === issue.id;

                if (isEditing && isLoggedIn) {
                  return (
                    <tr key={issue.id} className="bg-green-50">
                      <td colSpan={4} className="px-6 py-4">
                        <form onSubmit={handleEdit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                              <input
                                type="text"
                                value={formData.id}
                                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={submitting}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
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
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{issue.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{issue.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{priceCount} prices</td>
                    {isLoggedIn && (
                      <td className="px-6 py-4 text-right">
                        {deleteConfirm === issue.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-red-600">Delete?</span>
                            <button
                              onClick={() => handleDelete(issue.id)}
                              disabled={submitting}
                              className="text-red-600 hover:text-red-700 font-medium text-sm"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-500 hover:text-gray-700 text-sm"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => startEdit(issue)}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(issue.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
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
              {(!data?.issues || data.issues.length === 0) && (
                <tr>
                  <td colSpan={isLoggedIn ? 4 : 3} className="px-6 py-8 text-center text-gray-500">
                    No issues found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
