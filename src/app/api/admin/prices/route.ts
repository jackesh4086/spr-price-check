import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { addPrice, updatePrice, deletePrice, type Price } from '@/lib/admin-data';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { modelId, issueId, type, price, min, max, from, warrantyDays, eta, notes } = body;

    if (!modelId || !issueId || !type) {
      return NextResponse.json(
        { error: 'modelId, issueId, and type are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['fixed', 'range', 'from', 'tbd'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid price type. Must be fixed, range, from, or tbd' },
        { status: 400 }
      );
    }

    // Validate type-specific fields
    if (type === 'fixed' && (price === undefined || price === null)) {
      return NextResponse.json(
        { error: 'Price is required for fixed type' },
        { status: 400 }
      );
    }
    if (type === 'range' && (min === undefined || max === undefined)) {
      return NextResponse.json(
        { error: 'Min and max are required for range type' },
        { status: 400 }
      );
    }
    if (type === 'from' && from === undefined) {
      return NextResponse.json(
        { error: 'From value is required for from type' },
        { status: 400 }
      );
    }

    const priceEntry: Price = {
      modelId,
      issueId,
      type,
      warrantyDays: warrantyDays ?? 0,
      eta: eta ?? '',
      notes: notes ?? '',
    };

    if (type === 'fixed') priceEntry.price = price;
    if (type === 'range') {
      priceEntry.min = min;
      priceEntry.max = max;
    }
    if (type === 'from') priceEntry.from = from;

    const data = await addPrice(priceEntry);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Add price error:', error);
    const message = error instanceof Error ? error.message : 'Failed to add price';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { modelId, issueId, type, price, min, max, from, warrantyDays, eta, notes } = body;

    if (!modelId || !issueId) {
      return NextResponse.json(
        { error: 'modelId and issueId are required' },
        { status: 400 }
      );
    }

    const updates: Partial<Price> = {};

    if (type !== undefined) {
      if (!['fixed', 'range', 'from', 'tbd'].includes(type)) {
        return NextResponse.json(
          { error: 'Invalid price type. Must be fixed, range, from, or tbd' },
          { status: 400 }
        );
      }
      updates.type = type;
    }

    if (price !== undefined) updates.price = price;
    if (min !== undefined) updates.min = min;
    if (max !== undefined) updates.max = max;
    if (from !== undefined) updates.from = from;
    if (warrantyDays !== undefined) updates.warrantyDays = warrantyDays;
    if (eta !== undefined) updates.eta = eta;
    if (notes !== undefined) updates.notes = notes;

    const data = await updatePrice(modelId, issueId, updates);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update price error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update price';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const issueId = searchParams.get('issueId');

    if (!modelId || !issueId) {
      return NextResponse.json(
        { error: 'modelId and issueId query parameters are required' },
        { status: 400 }
      );
    }

    const data = await deletePrice(modelId, issueId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Delete price error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete price';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
