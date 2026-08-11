import { createAdminClient } from '@/lib/supabase/admin';

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  const normalized = email.toLowerCase().trim();
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('listUsers:', error);
      return null;
    }
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) return match.id;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}
