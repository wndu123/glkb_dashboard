import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-secret');
  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await initDb();
  return NextResponse.json({ ok: true });
}
