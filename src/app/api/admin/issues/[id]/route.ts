import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { updateIssue, deleteIssue } from '@/lib/admin-data';

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
    const { name, newId } = body;

    const updates: { id?: string; name?: string } = {};
    if (name) updates.name = name;
    if (newId) {
      // Validate new id format
      if (!/^[a-zA-Z0-9_-]+$/.test(newId)) {
        return NextResponse.json(
          { error: 'Issue id can only contain letters, numbers, hyphens, and underscores' },
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

    const data = await updateIssue(id, updates);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update issue error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update issue';
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
    const data = await deleteIssue(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Delete issue error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete issue';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
