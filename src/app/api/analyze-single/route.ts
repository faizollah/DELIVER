import { NextResponse } from 'next/server';
import { analyzeSingleReview } from '@/app/actions';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    const results = await analyzeSingleReview(text.trim());
    return NextResponse.json(results, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
