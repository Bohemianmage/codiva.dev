import { NextResponse } from 'next/server';

function proxyHeaders(request: Request) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ua = request.headers.get('user-agent');
  if (forwarded) headers['x-forwarded-for'] = forwarded;
  if (realIp) headers['x-real-ip'] = realIp;
  if (ua) headers['user-agent'] = ua;
  return headers;
}

/** Reenvía un POST JSON a otra ruta del mismo origin (aliases deprecados). */
export async function proxyJsonPost(request: Request, pathname: string) {
  const body = await request.json();
  const url = new URL(pathname, request.url);
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
