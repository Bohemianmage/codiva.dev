import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  offerLetterFilename,
  renderOfferLetterHtml,
  rowToOfferLetterData,
} from '@/lib/ops/offer-letter';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('id, role, active')
    .eq('id', user.id)
    .eq('active', true)
    .maybeSingle();

  if (!staff || staff.role !== 'admin') {
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
  }

  const { data: offer } = await supabase
    .from('ops_personnel_offers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!offer) {
    return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 });
  }

  const html = renderOfferLetterHtml(rowToOfferLetterData(offer));
  const filename = offerLetterFilename(offer.full_name);

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
