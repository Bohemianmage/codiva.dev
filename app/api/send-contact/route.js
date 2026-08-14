import { NextResponse } from 'next/server';

function proxyHeaders(request) {
  const headers = { 'Content-Type': 'application/json' };
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ua = request.headers.get('user-agent');
  if (forwarded) headers['x-forwarded-for'] = forwarded;
  if (realIp) headers['x-real-ip'] = realIp;
  if (ua) headers['user-agent'] = ua;
  return headers;
}

/** @deprecated Use POST /api/inbox */
export async function POST(request) {
  const body = await request.json();
  const url = new URL('/api/inbox', request.url);
  const res = await fetch(url, {
    method: 'POST',
    headers: proxyHeaders(request),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const retryAfter = res.headers.get('Retry-After');
  return NextResponse.json(data, {
    status: res.status,
    headers: retryAfter ? { 'Retry-After': retryAfter } : undefined,
  });
}
