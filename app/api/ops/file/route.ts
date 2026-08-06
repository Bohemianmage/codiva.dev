import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createOpsSignedUrl,
  isOpsStoragePath,
  projectIdFromOpsPath,
} from '@/lib/ops/storage';
import { logActivity } from '@/lib/ops/activity';
import { requestAuditFromHeaders } from '@/lib/ops/request-audit';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path')?.trim() ?? '';
  const documentId = searchParams.get('documentId');
  const audit = requestAuditFromHeaders(request.headers);

  if (!path || path.includes('..') || path.includes('\\') || !isOpsStoragePath(path)) {
    return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
  }

  const projectId = projectIdFromOpsPath(path);
  if (!projectId) {
    return NextResponse.json({ error: 'Proyecto inválido en ruta' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('id')
    .eq('id', user.id)
    .eq('active', true)
    .maybeSingle();

  if (!staff) {
    const { data: membership } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
    }
  }

  if (documentId && /^[0-9a-f-]{36}$/i.test(documentId)) {
    const admin = createAdminClient();
    const { data: doc } = await admin
      .from('documents')
      .select('disposed_at, scan_status')
      .eq('id', documentId)
      .maybeSingle();
    if (doc?.disposed_at) {
      return NextResponse.json({ error: 'Documento eliminado por retención' }, { status: 410 });
    }
    if (doc?.scan_status === 'infected') {
      return NextResponse.json({ error: 'Documento bloqueado' }, { status: 403 });
    }
  }

  try {
    const signedUrl = await createOpsSignedUrl(path);
    const admin = createAdminClient();

    await admin.from('file_access_log').insert({
      project_id: projectId,
      document_id: documentId && /^[0-9a-f-]{36}$/i.test(documentId) ? documentId : null,
      file_path: path,
      action: 'download',
      actor_id: user.id,
      ip: audit.ip,
      user_agent: audit.userAgent,
    });

    await logActivity({
      entityType: 'file',
      entityId: projectId,
      action: 'download',
      actorId: user.id,
      metadata: {
        project_id: projectId,
        file_path: path,
        document_id: documentId,
        via: 'api/ops/file',
        ip: audit.ip,
        user_agent: audit.userAgent,
      },
    });

    return NextResponse.redirect(signedUrl, 302);
  } catch {
    return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 });
  }
}
