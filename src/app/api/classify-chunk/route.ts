import { NextRequest, NextResponse } from 'next/server';
import { classifyTexts } from '@/app/actions';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
	try {
		const { texts } = await req.json();
		if (!Array.isArray(texts) || texts.length === 0) {
			return NextResponse.json({ error: 'texts must be a non-empty array' }, { status: 400 });
		}
		const results = await classifyTexts(texts as string[]);
		return NextResponse.json({ results });
	} catch {
		return NextResponse.json({ error: 'Chunk classification failed' }, { status: 500 });
	}
}
