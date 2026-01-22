import { NextResponse } from 'next/server';
import { getPriceData, seedPriceData } from '@/lib/admin-data';

// GET is public - anyone can view prices
export async function GET() {
  try {
    // Ensure data is seeded
    await seedPriceData();

    const data = await getPriceData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get data error:', error);
    return NextResponse.json(
      { error: 'Failed to get price data' },
      { status: 500 }
    );
  }
}
