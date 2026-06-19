import { NextResponse } from 'next/server';

/** @deprecated Use POST /api/inbox */
export async function POST(request) {
  const body = await request.json();
  const url = new URL('/api/inbox', request.url);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
