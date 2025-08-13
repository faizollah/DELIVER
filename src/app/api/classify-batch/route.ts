import { NextRequest, NextResponse } from 'next/server';
import { classifyTexts } from '@/app/actions';

export const maxDuration = 60; // allow up to 60s on Vercel

export async function POST(req: NextRequest) {
	try {
		const { texts } = await req.json();
		if (!Array.isArray(texts)) {
			return NextResponse.json({ error: 'texts must be an array' }, { status: 400 });
		}
		const results = await classifyTexts(texts as string[]);
		return NextResponse.json({ results });
	} catch {
		return NextResponse.json({ error: 'Classification request failed' }, { status: 500 });
	}
}
