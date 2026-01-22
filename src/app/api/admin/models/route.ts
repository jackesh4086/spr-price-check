import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { addModel } from '@/lib/admin-data';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, brand } = body;

    if (!id || !name || !brand) {
      return NextResponse.json(
        { error: 'Model id, name, and brand are required' },
        { status: 400 }
      );
    }

    // Validate id format (alphanumeric with optional hyphens/underscores/spaces)
    if (!/^[a-zA-Z0-9_\- ]+$/.test(id)) {
      return NextResponse.json(
        { error: 'Model id can only contain letters, numbers, hyphens, underscores, and spaces' },
        { status: 400 }
      );
    }

    const data = await addModel({ id, name, brand });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Add model error:', error);
    const message = error instanceof Error ? error.message : 'Failed to add model';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
