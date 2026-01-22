import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { addIssue } from '@/lib/admin-data';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Issue id and name are required' },
        { status: 400 }
      );
    }

    // Validate id format (alphanumeric with optional hyphens/underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json(
        { error: 'Issue id can only contain letters, numbers, hyphens, and underscores' },
        { status: 400 }
      );
    }

    const data = await addIssue({ id, name });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Add issue error:', error);
    const message = error instanceof Error ? error.message : 'Failed to add issue';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
