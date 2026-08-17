import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createOpsSignedUrl } from '@/lib/ops/storage';
import { logActivity } from '@/lib/ops/activity';
import { can } from '@/lib/ops/permissions';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')?.trim() ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
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
    .select('id, role, active, capabilities')
    .eq('id', user.id)
    .eq('active', true)
    .maybeSingle();
  if (!staff) {
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: contract } = await admin
    .from('ops_staff_contracts')
    .select('id, staff_id, file_path, original_filename')
    .eq('id', id)
    .maybeSingle();
  if (!contract) {
    return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
  }

  const isOwner = contract.staff_id === user.id;
  const canManageTeam = can(staff, 'team');
  if (!isOwner && !canManageTeam) {
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
  }

  if (!contract.file_path.startsWith(`staff/${contract.staff_id}/`)) {
    return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
  }

  try {
    const signedUrl = await createOpsSignedUrl(contract.file_path);
    await logActivity({
      entityType: 'staff_contract',
      entityId: contract.id,
      action: 'download',
      actorId: user.id,
      metadata: { staff_id: contract.staff_id, file_path: contract.file_path },
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch {
    return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 });
  }
}
