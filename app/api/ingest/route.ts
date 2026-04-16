import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-secret');
  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { timestamp, source = 'playwright', recipient, severity, test, file, error, type, run_id } = body;

  if (!timestamp || !recipient || !severity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await sql`
    INSERT INTO incidents (timestamp, source, recipient, severity, test, file, error, type, run_id)
    VALUES (${timestamp}, ${source}, ${recipient}, ${severity}, ${test}, ${file}, ${error}, ${type}, ${run_id})
  `;

  return NextResponse.json({ ok: true });
}
