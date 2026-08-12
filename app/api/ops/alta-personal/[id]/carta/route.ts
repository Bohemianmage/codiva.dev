import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { htmlToPdf } from '@/lib/ops/html-to-pdf';
import {
  offerLetterFilename,
  renderOfferLetterHtml,
  rowToOfferLetterData,
} from '@/lib/ops/offer-letter';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const format = new URL(request.url).searchParams.get('format');
  const asPdf = format === 'pdf';

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

  if (!asPdf) {
    const filename = offerLetterFilename(offer.full_name, 'html');
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  try {
    const pdf = await htmlToPdf(html);
    const filename = offerLetterFilename(offer.full_name, 'pdf');
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[carta] PDF generation failed', err);
    return NextResponse.json(
      { error: 'No se pudo generar el PDF. Verifica Chrome/Chromium en el entorno.' },
      { status: 500 }
    );
  }
}
