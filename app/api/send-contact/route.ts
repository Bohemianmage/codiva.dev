import { proxyJsonPost } from '@/lib/http-proxy';

/** @deprecated Use POST /api/inbox */
export async function POST(request: Request) {
  return proxyJsonPost(request, '/api/inbox');
}
