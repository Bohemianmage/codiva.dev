import { createAdminClient } from '@/lib/supabase/admin';

export async function logActivity({
  entityType,
  entityId,
  action,
  metadata = {},
  actorId,
}: {
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
  actorId?: string | null;
}) {
  try {
    const admin = createAdminClient();
    await admin.from('activity_log').insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      metadata,
      actor_id: actorId ?? null,
    });
  } catch {
    // non-blocking
  }
}
