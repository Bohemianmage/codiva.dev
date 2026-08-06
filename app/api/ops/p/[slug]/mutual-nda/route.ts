import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  buildMutualNdaHtml,
  mutualNdaFilename,
} from '@/lib/ops/legal/mutual-nda';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
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

  let projectQuery = supabase
    .from('projects')
    .select('id, name, slug, description, client_visible, organizations(name)')
    .eq('slug', slug);

  if (!staff) {
    projectQuery = projectQuery.eq('client_visible', true);
  }

  const { data: project } = await projectQuery.maybeSingle();
  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
  }

  if (!staff) {
    const { data: membership } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', project.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
    }
  }

  const org = project.organizations as { name?: string } | { name?: string }[] | null;
  const orgName = Array.isArray(org) ? org[0]?.name : org?.name;
  const clientName = orgName?.trim() || project.name;

  const html = buildMutualNdaHtml({
    clientName,
    projectName: project.name,
    projectScope: project.description,
    effectiveDate: new Date(),
  });

  const filename = mutualNdaFilename(clientName);

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
