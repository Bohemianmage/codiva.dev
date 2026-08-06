import { CODIVA_BRAND } from '@/lib/brand';

const CODIVA_LEGAL_NAME = 'Codiva';
const CODIVA_DOMICILIO =
  'Goldsmith número 40, colonia Polanco III Sección, Alcaldía Miguel Hidalgo, Ciudad de México, código postal 11550';
const DEFAULT_JURISDICTION = 'la Ciudad de México';

export type MutualNdaInput = {
  clientName: string;
  projectName: string;
  /** Alcance breve del proyecto (sin montos ni notas internas). */
  projectScope?: string | null;
  jurisdiction?: string | null;
  effectiveDate?: Date;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Ruta autenticada del NDA mutuo vivo por proyecto. */
export function mutualNdaPath(slug: string) {
  return `/api/ops/p/${encodeURIComponent(slug)}/mutual-nda`;
}

export function mutualNdaFilename(clientName: string) {
  const safe = clientName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `NDA-Codiva-${safe || 'Cliente'}.html`;
}

export function buildMutualNdaHtml(input: MutualNdaInput): string {
  const clientName = (input.clientName || 'Cliente').trim();
  const projectName = (input.projectName || 'Proyecto').trim();
  const scope = (input.projectScope || '').trim();
  const jurisdiction = (input.jurisdiction || DEFAULT_JURISDICTION).trim();
  const effective = input.effectiveDate ?? new Date();
  const effectiveLabel = formatLongDate(effective);
  const email = CODIVA_BRAND.urls.email;

  const objectBody = scope
    ? `Las Partes desean evaluar y, en su caso, desarrollar el proyecto <strong>${escapeHtml(projectName)}</strong> (${escapeHtml(scope)}), en adelante el “Proyecto”. Con ese fin compartirán Información Confidencial.`
    : `Las Partes desean evaluar y, en su caso, desarrollar el proyecto <strong>${escapeHtml(projectName)}</strong> (el “Proyecto”). Con ese fin compartirán Información Confidencial.`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>NDA - ${escapeHtml(CODIVA_LEGAL_NAME)} × ${escapeHtml(clientName)}</title>
  <style>
    body {
      margin: 0;
      font-family: "Georgia", "Times New Roman", serif;
      color: #1a1a1a;
      background: #f7f7f5;
      line-height: 1.65;
    }
    main {
      max-width: 720px;
      margin: 0 auto;
      padding: 56px 28px 80px;
      background: #fff;
      min-height: 100vh;
      box-shadow: 0 0 0 1px #e5e5e0;
    }
    h1 { font-size: 1.55rem; margin: 0 0 8px; }
    .sub { color: #555; font-family: "Segoe UI", system-ui, sans-serif; font-size: 14px; margin-bottom: 32px; }
    h2 { font-size: 1.05rem; margin: 28px 0 10px; }
    p, li { font-size: 15px; }
    .banner {
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 13px;
      background: #fff8e8;
      border: 1px solid #ead9a8;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 28px;
    }
    .sign {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 48px;
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 14px;
    }
    .line { border-top: 1px solid #222; margin-top: 48px; padding-top: 8px; }
    @media (max-width: 640px) { .sign { grid-template-columns: 1fr; } }
    @media print {
      body { background: #fff; }
      main { box-shadow: none; padding: 24px; }
      .banner { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <main>
    <h1>Acuerdo de confidencialidad (NDA)</h1>
    <p class="sub">Borrador mutuamente vinculante · ${escapeHtml(CODIVA_LEGAL_NAME)} ↔ ${escapeHtml(clientName)} · México<br />
      ${escapeHtml(CODIVA_LEGAL_NAME)}: ${escapeHtml(CODIVA_DOMICILIO)} · ${escapeHtml(email)}</p>
    <div class="banner">
      Documento generado desde el portal del proyecto. Debe firmarlo el representante legal de
      ${escapeHtml(clientName)} y devolverse en PDF desde Documentos → Solicitudes.
    </div>

    <p>
      Este Acuerdo se celebra entre <strong>${escapeHtml(CODIVA_LEGAL_NAME)}</strong> (“Parte Reveladora / Receptora”) y
      <strong>${escapeHtml(clientName)}</strong> (“Parte Reveladora / Receptora”), en adelante las “Partes”, con fecha
      efectiva <strong>${escapeHtml(effectiveLabel)}</strong>.
    </p>

    <h2>1. Objeto</h2>
    <p>${objectBody}</p>

    <h2>2. Información Confidencial</h2>
    <p>
      Significa toda información técnica, comercial, financiera, de producto, arquitectura,
      código, datos operativos, credenciales, documentación y materiales
      marcados como confidenciales o que por su naturaleza deban tratarse como tales.
    </p>

    <h2>3. Obligaciones</h2>
    <ul>
      <li>Usar la Información Confidencial únicamente para evaluar o ejecutar el Proyecto.</li>
      <li>No divulgarla a terceros sin autorización escrita, salvo asesores bajo deber de confidencialidad equivalente.</li>
      <li>Aplicar al menos el mismo grado de cuidado que usa con su propia información sensible.</li>
      <li>Limitar el acceso a personal con necesidad de conocerla.</li>
    </ul>

    <h2>4. Exclusiones</h2>
    <p>
      No es confidencial la información que: (a) sea o pase a ser pública sin incumplimiento;
      (b) ya poseía legítimamente la Parte Receptora; (c) reciba de un tercero sin deber de secreto;
      o (d) deba revelarse por ley u orden judicial (avisando con anticipación razonable cuando sea legal).
    </p>

    <h2>5. Propiedad intelectual</h2>
    <p>
      Nada en este NDA transfiere titularidad de PI. Los entregables de desarrollo se regirán
      por el contrato de servicios / cotización aceptada.
    </p>

    <h2>6. Plazo</h2>
    <p>
      Vigencia: <strong>2 años</strong> desde la fecha efectiva, o mientras exista negociación/contrato
      del Proyecto, lo que ocurra después. Las obligaciones sobre secretos comerciales subsisten
      mientras mantengan ese carácter.
    </p>

    <h2>7. Devolución / destrucción</h2>
    <p>
      A solicitud escrita, la Parte Receptora devolverá o destruirá la Información Confidencial
      en su poder, salvo copias de respaldo automatizadas o retención legal obligatoria.
    </p>

    <h2>8. Ley aplicable</h2>
    <p>
      Leyes de los Estados Unidos Mexicanos. Jurisdicción: tribunales de
      <strong>${escapeHtml(jurisdiction)}</strong>.
    </p>

    <div class="sign">
      <div>
        <div class="line">Por ${escapeHtml(CODIVA_LEGAL_NAME)}<br />Nombre / cargo<br />Fecha</div>
      </div>
      <div>
        <div class="line">Por ${escapeHtml(clientName)}<br />Representante legal / cargo<br />Fecha</div>
      </div>
    </div>
  </main>
</body>
</html>`;
}
