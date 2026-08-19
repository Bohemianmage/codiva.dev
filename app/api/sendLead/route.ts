import { proxyJsonPost } from '@/lib/http-proxy';

/** @deprecated Use POST /api/leads */
export async function POST(request: Request) {
  return proxyJsonPost(request, '/api/leads');
}
