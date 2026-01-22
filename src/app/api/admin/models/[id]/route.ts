import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { updateModel, deleteModel } from '@/lib/admin-data';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, newId, brand } = body;

    const updates: { id?: string; name?: string; brand?: string } = {};
    if (name) updates.name = name;
    if (brand) updates.brand = brand;
    if (newId) {
      // Validate new id format
      if (!/^[a-zA-Z0-9_-]+$/.test(newId)) {
        return NextResponse.json(
          { error: 'Model id can only contain letters, numbers, hyphens, and underscores' },
          { status: 400 }
        );
      }
      updates.id = newId;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const data = await updateModel(id, updates);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update model error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update model';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await deleteModel(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Delete model error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete model';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
