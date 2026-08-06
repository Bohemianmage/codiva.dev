import { LEGAL_DOCS_VERSION, LEGAL_UPDATED_LABEL } from '@/lib/ops/legal/version';

export type LegalSection = {
  id: string;
  title: string;
  body?: string;
  lead?: string;
  items?: string[];
  closing?: string;
  legalNote?: string;
  groups?: { title: string; items: string[] }[];
};

export type LegalDocument = {
  title: string;
  versionCode: string;
  updated: string;
  intro: string[];
  introLegalNote?: string;
  sections: LegalSection[];
};

const CONTACT_EMAIL = 'hello@codiva.dev';
const DOMICILIO =
  'Goldsmith número 40, colonia Polanco III Sección, Alcaldía Miguel Hidalgo, Ciudad de México, código postal 11550';

export const TERMS_OF_USE: LegalDocument = {
  title: 'Términos y Condiciones de Uso',
  versionCode: LEGAL_DOCS_VERSION,
  updated: LEGAL_UPDATED_LABEL,
  intro: [
    `El presente sitio web y los servicios digitales de Codiva.dev (en adelante, el “Sitio”, la “Plataforma” o el “Portal”) son operados por Codiva (en adelante, “nosotros”, “nuestro” o el “Titular”), con domicilio en ${DOMICILIO}. Correo de contacto para asuntos legales y de privacidad: ${CONTACT_EMAIL}.`,
    'Estos Términos se rigen por los principios de autonomía de la voluntad y libertad contractual reconocidos por los artículos 6°, 7° y 78 de la Ley Federal de Protección al Consumidor (LFPC), y 1793 y 1794 del Código Civil Federal (CCF).',
  ],
  introLegalNote:
    'La aceptación de estos Términos, del Aviso de Privacidad y, cuando aplique, del NDA del proyecto, es condición para usar el Portal del cliente.',
  sections: [
    {
      id: 'definitions',
      title: '1. Definiciones',
      lead: 'Para efectos de estos Términos, se entenderá por:',
      items: [
        'Plataforma / Portal: el sitio web, aplicaciones y herramientas digitales de Codiva (ops.codiva.dev para el equipo Codiva; portal.codiva.dev para clientes, u otros dominios que indiquemos).',
        'Usuario: toda persona física que acceda, se registre o utilice la Plataforma, incluyendo colaboradores del cliente invitados a un proyecto.',
        'Cliente: la persona moral o física contratante o prospecto con la que Codiva negocia o ejecuta un proyecto.',
        'Proyecto: el espacio del Portal asociado a una organización cliente, donde pueden participar múltiples Usuarios con distintos roles.',
        'Servicios: desarrollo de software a la medida, productos digitales, consultoría técnica, cotizaciones, entrega de documentos y funcionalidades del Portal.',
      ],
    },
    {
      id: 'acceptance',
      title: '2. Aceptación expresa',
      body: 'El acceso y uso del Portal implica la aceptación expresa e inequívoca de estos Términos, del Aviso de Privacidad y, en proyectos que lo requieran, del Acuerdo de Confidencialidad (NDA). Si no está de acuerdo, debe abstenerse de utilizar el Portal.',
      legalNote:
        'Artículo 1803 del Código Civil Federal: la oferta dirigida al público obliga al oferente hacia quien acepte cumplir las condiciones.',
    },
    {
      id: 'capacity',
      title: '3. Capacidad legal',
      body: 'Al utilizar la Plataforma declara tener capacidad legal suficiente conforme al derecho mexicano (mayor de 18 años y no incapacitado legalmente). Si actúa en representación de una persona moral, declara tener facultades para vincularla.',
    },
    {
      id: 'modifications',
      title: '4. Modificaciones',
      body: 'Podemos modificar estos Términos para adaptarlos a cambios legislativos, nuevos servicios o mejores prácticas. Los cambios entran en vigor al publicarse. Ante cambios sustanciales se le pedirá una nueva aceptación en el Portal o se notificará por los medios de contacto registrados. El uso continuado después de aceptar la nueva versión constituye aceptación.',
    },
    {
      id: 'service',
      title: '5. Descripción del servicio',
      body: 'Codiva ofrece servicios de diseño y desarrollo de software a la medida, productos digitales e integraciones, así como un Portal para compartir cotizaciones, arquitectura, documentos, entregables y seguimiento de proyecto. El alcance comercial específico se rige por la cotización, propuesta o contrato aceptado. Nos reservamos el derecho de modificar, suspender o descontinuar temporal o permanentemente partes no esenciales del Portal, con aviso razonable cuando afecte al Cliente.',
    },
    {
      id: 'account',
      title: '6. Registro y cuenta',
      lead: 'Para acceder al Portal podrá crearse o invitarse una cuenta. Usted se compromete a:',
      items: [
        'Proporcionar información veraz, exacta, actual y completa.',
        'Mantener la confidencialidad de su contraseña y de la actividad bajo su cuenta.',
        'Notificarnos de inmediato cualquier uso no autorizado o incidente de seguridad.',
        'Ser responsable de las actividades realizadas con sus credenciales.',
      ],
      closing:
        'Podemos suspender o cancelar una cuenta si se violan estos Términos o detectamos abuso, fraude o riesgo de seguridad.',
    },
    {
      id: 'multiuser',
      title: '7. Múltiples usuarios por proyecto',
      body: 'Un mismo Proyecto puede tener varios Usuarios invitados (por ejemplo, stakeholders, legales u operación). Cada Usuario debe aceptar de forma individual los Términos, el Aviso de Privacidad y el NDA aplicables en su primer acceso. Las acciones de un Usuario (aceptar cotización, subir documentos, crear tickets) pueden atribuirse a la organización Cliente según el rol asignado.',
    },
    {
      id: 'obligations',
      title: '8. Obligaciones y conducta',
      lead: 'El Usuario se obliga a usar la Plataforma de forma lícita y conforme a estos Términos. En particular, se prohíbe:',
      items: [
        'Usar la Plataforma con fines ilícitos o que vulneren derechos de terceros.',
        'Infringir derechos de propiedad intelectual de Codiva o de terceros.',
        'Revender o comercializar el acceso al Portal sin autorización.',
        'Cargar contenido difamatorio, ilícito o que contenga malware.',
        'Intentar acceder a datos de otros clientes o eludir controles de seguridad.',
        'Suplantar la identidad de otra persona o entidad.',
      ],
    },
    {
      id: 'confidentiality',
      title: '9. Confidencialidad y NDA',
      body: 'La información comercial, técnica y de proyecto compartida en el Portal se trata como confidencial. Cuando el Proyecto incluya un NDA, su aceptación en el Portal complementa —y no sustituye— cualquier acuerdo firmado por separado. El Usuario se obliga a no divulgar Información Confidencial fuera del círculo de necesidad de conocer de su organización.',
    },
    {
      id: 'ip',
      title: '10. Propiedad intelectual',
      body: 'Los derechos sobre la Plataforma, su código, diseño, marcas y materiales de Codiva son titularidad de Codiva o de sus licenciantes. El acceso al Portal no transfiere PI. La titularidad de entregables de software del Cliente se rige por la cotización o contrato de servicios correspondiente.',
    },
    {
      id: 'security',
      title: '11. Seguridad',
      body: 'Implementamos medidas técnicas y organizativas razonables para proteger la información del Portal (control de acceso, cifrado en tránsito, almacenamiento privado de archivos y registro de actividad relevante). Ningún sistema es infalible; el Usuario también debe proteger sus credenciales y dispositivos.',
      legalNote: 'Artículo 19 de la LFPDPPP.',
    },
    {
      id: 'ai',
      title: '12. Herramientas asistidas por IA',
      body: 'Codiva puede usar herramientas automatizadas o de inteligencia artificial de forma asistiva (por ejemplo, apoyo a documentación o operaciones internas). Estos procesos no sustituyen dictámenes legales ni decisiones contractuales vinculantes sin revisión humana cuando corresponda.',
    },
    {
      id: 'liability',
      title: '13. Limitación de responsabilidad',
      lead: 'En la máxima medida permitida por la ley aplicable, el Portal se ofrece “tal cual” y “según disponibilidad”. Codiva no será responsable por:',
      items: [
        'Daños indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso del Portal.',
        'Interrupciones, fallos técnicos, pérdida de datos o errores en contenidos generados por terceros.',
        'Decisiones de negocio del Cliente basadas únicamente en materiales de discovery o cotización sin contrato firmado.',
      ],
      closing:
        'Las obligaciones de desarrollo y garantías comerciales se rigen por el contrato o cotización aceptada del Proyecto.',
    },
    {
      id: 'indemnity',
      title: '14. Indemnización',
      lead: 'El Usuario se compromete a mantener indemne a Codiva frente a reclamos derivados de:',
      items: [
        'Su uso indebido del Portal.',
        'El incumplimiento de estos Términos o del NDA.',
        'Contenido que cargue y que vulnere derechos de terceros.',
      ],
    },
    {
      id: 'links',
      title: '15. Enlaces a terceros',
      body: 'El Portal puede incluir enlaces a sitios de terceros. Codiva no controla ni es responsable de su contenido ni de sus políticas de privacidad. El acceso es bajo su responsabilidad.',
    },
    {
      id: 'law',
      title: '16. Ley aplicable y jurisdicción',
      body: 'Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Para controversias, las partes se someten a los tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponderles por razón de domicilio.',
    },
    {
      id: 'partyRelation',
      title: '17. Relación entre las partes',
      body: 'El uso del Portal no crea relación laboral, sociedad, agencia ni representación exclusiva entre las partes, salvo lo pactado en contrato de servicios.',
    },
    {
      id: 'assignment',
      title: '18. Cesión',
      body: 'Codiva podrá ceder derechos u obligaciones derivados de estos Términos a afiliadas o adquirentes del negocio, sin autorización previa del Usuario. El Usuario no podrá ceder su cuenta sin consentimiento escrito.',
    },
    {
      id: 'severability',
      title: '19. Divisibilidad',
      body: 'Si alguna disposición fuera declarada nula o inaplicable, las demás continuarán vigentes.',
    },
  ],
};

export const PRIVACY_NOTICE: LegalDocument = {
  title: 'Aviso de Privacidad',
  versionCode: LEGAL_DOCS_VERSION,
  updated: LEGAL_UPDATED_LABEL,
  intro: [
    'De conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento, ponemos a su disposición el siguiente aviso de privacidad.',
    `Responsable del tratamiento: Codiva.dev, con domicilio en ${DOMICILIO}. Correo de contacto para privacidad y derechos ARCO: ${CONTACT_EMAIL}.`,
  ],
  introLegalNote: 'Artículos 1° al 100 de la LFPDPPP.',
  sections: [
    {
      id: 'data',
      title: '1. Datos personales recabados',
      lead: 'Podemos recabar, de forma directa o a través de proveedores, los siguientes datos:',
      groups: [
        {
          title: 'Identificación y contacto',
          items: [
            'Nombre, correo electrónico, teléfono, empresa, cargo y datos de facturación cuando apliquen.',
          ],
        },
        {
          title: 'Cuenta y acceso',
          items: [
            'Credenciales (contraseña cifrada por el proveedor de autenticación), rol en el proyecto, registros de acceso y actividad en el Portal.',
          ],
        },
        {
          title: 'Proyecto y documentación',
          items: [
            'Contenido de cotizaciones, tickets, mensajes, archivos subidos (contratos, NDA, evidencias) y metadatos asociados.',
          ],
        },
        {
          title: 'Técnicos',
          items: [
            'Dirección IP, tipo de navegador, registros de seguridad y cookies necesarias de sesión.',
          ],
        },
      ],
    },
    {
      id: 'purposes',
      title: '2. Finalidades del tratamiento',
      lead: 'Finalidades primarias (necesarias para el servicio):',
      items: [
        'Crear y gestionar cuentas e invitaciones a proyectos.',
        'Operar el Portal (cotizaciones, documentos, entregables, tickets, aceptaciones legales).',
        'Comunicar avances, propuestas y soporte relacionados con el proyecto.',
        'Cumplir obligaciones contractuales, fiscales y de seguridad.',
      ],
      closing:
        'Finalidades secundarias (opcionales): enviar comunicaciones comerciales sobre servicios de Codiva. Puede oponerse en cualquier momento escribiendo a ' +
        CONTACT_EMAIL +
        '.',
    },
    {
      id: 'automated',
      title: '3. Tratamiento automatizado e IA',
      body: 'Podemos usar herramientas automatizadas o de IA de forma asistiva para operación interna (por ejemplo, redacción o clasificación). No tomamos decisiones legales o contractuales vinculantes basadas únicamente en medios automatizados sin revisión humana cuando la ley o el contexto lo requieran.',
    },
    {
      id: 'security',
      title: '4. Medidas de seguridad',
      body: 'Aplicamos medidas razonables de seguridad: autenticación, control de acceso por proyecto, almacenamiento privado de archivos, cifrado en tránsito (TLS) y proveedores con estándares de la industria. El acceso al Portal del cliente está limitado a miembros invitados y al personal autorizado de Codiva.',
    },
    {
      id: 'subprocessors',
      title: '5. Encargados y subprocesadores',
      lead: 'Proveedores relevantes que pueden tratar datos en nombre de Codiva para operar el servicio:',
      items: [
        'Vercel — alojamiento y edge.',
        'Supabase — base de datos, autenticación y almacenamiento.',
        'Resend — correo transaccional.',
        'Stripe — pagos, cuando el proyecto lo use.',
      ],
      closing:
        'Cada proveedor aplica sus propias medidas. Codiva permanece como responsable frente al titular por las finalidades que determina.',
    },
    {
      id: 'cookies',
      title: '6. Cookies y tecnologías similares',
      body: 'Usamos cookies y tecnologías similares necesarias para sesión, seguridad y preferencias. Puede configurar su navegador para bloquearlas; algunas funciones del Portal podrían dejar de operar.',
    },
    {
      id: 'transfers',
      title: '7. Transferencias',
      body: 'Los datos pueden tratarse dentro o fuera de México por proveedores de nube y correo que nos apoyan en la operación, obligados a confidencialidad y seguridad contractuales. No vendemos datos personales.',
    },
    {
      id: 'arco',
      title: '8. Derechos ARCO',
      body: 'Usted puede acceder, rectificar, cancelar u oponerse al tratamiento de sus datos personales (“Derechos ARCO”), así como revocar el consentimiento cuando proceda, en los términos de la LFPDPPP.',
    },
    {
      id: 'procedure',
      title: '9. Procedimiento ARCO',
      items: [
        `Envíe su solicitud a ${CONTACT_EMAIL} acreditando identidad y describiendo claramente el derecho que desea ejercer.`,
        'Responderemos en un plazo de 20 días hábiles; de resultar procedente, se hará efectiva en 15 días hábiles adicionales, o le informaremos el motivo de improcedencia.',
      ],
    },
    {
      id: 'revocation',
      title: '10. Revocación del consentimiento',
      body: 'Puede revocar el consentimiento para tratamientos que lo requieran. La revocación no afectará tratamientos necesarios para ejecutar la relación contractual o cumplir obligaciones legales.',
    },
    {
      id: 'limiting',
      title: '11. Limitación de uso o divulgación',
      body: 'Puede inscribirse en el Registro Público para Evitar Publicidad (REPEP) de la Profeco. Para limitar el uso de sus datos por Codiva, ejerza sus derechos ARCO o escriba a ' +
        CONTACT_EMAIL +
        '.',
    },
    {
      id: 'changes',
      title: '12. Cambios al aviso',
      body: 'Podemos modificar este aviso. Los cambios se publicarán con nueva versión. Si el cambio es sustancial, se solicitará una nueva aceptación en el Portal o se notificará por correo.',
    },
    {
      id: 'contact',
      title: '13. Contacto',
      items: [
        `Correo general y protección de datos: ${CONTACT_EMAIL}`,
        `Domicilio: ${DOMICILIO}`,
        'Marca: Codiva.dev — software a la medida y productos digitales.',
      ],
    },
  ],
};

export const PORTAL_NDA: LegalDocument = {
  title: 'Acuerdo de Confidencialidad (NDA) — Portal de proyecto',
  versionCode: LEGAL_DOCS_VERSION,
  updated: LEGAL_UPDATED_LABEL,
  intro: [
    'Este Acuerdo de Confidencialidad aplica al acceso al Portal del proyecto entre Codiva y la organización Cliente (y sus Usuarios invitados). La aceptación digital expresa en el Portal (clickwrap) constituye consentimiento válido para estos efectos; no sustituye un NDA firmado ante notario ni firma electrónica avanzada cuando las partes lo pacten por separado.',
    `Codiva, con domicilio en ${DOMICILIO}. Contacto: ${CONTACT_EMAIL}.`,
  ],
  sections: [
    {
      id: 'object',
      title: '1. Objeto',
      body: 'Las partes compartirán Información Confidencial para evaluar, negociar o ejecutar el Proyecto mostrado en el Portal (cotizaciones, arquitectura, documentos, entregables y comunicaciones asociadas).',
    },
    {
      id: 'confidential',
      title: '2. Información Confidencial',
      body: 'Incluye información técnica, comercial, financiera, de producto, arquitectura, código, unit economics, credenciales, documentación y cualquier material marcado como confidencial o que por su naturaleza deba tratarse como tal.',
    },
    {
      id: 'obligations',
      title: '3. Obligaciones',
      items: [
        'Usar la Información Confidencial solo para evaluar o ejecutar el Proyecto.',
        'No divulgarla a terceros sin autorización escrita, salvo asesores bajo deber de confidencialidad equivalente.',
        'Aplicar al menos el mismo cuidado que con su propia información sensible.',
        'Limitar el acceso a personas con necesidad de conocerla dentro de su organización.',
      ],
    },
    {
      id: 'exclusions',
      title: '4. Exclusiones',
      body: 'No es confidencial la información que: (a) sea o pase a ser pública sin incumplimiento; (b) ya poseía legítimamente la Parte Receptora; (c) reciba de un tercero sin deber de secreto; o (d) deba revelarse por ley u orden judicial (avisando con anticipación razonable cuando sea legal).',
    },
    {
      id: 'ip',
      title: '5. Propiedad intelectual',
      body: 'Nada en este NDA transfiere titularidad de PI. Los entregables de desarrollo se rigen por la cotización o contrato de servicios.',
    },
    {
      id: 'term',
      title: '6. Plazo',
      body: 'Las obligaciones de confidencialidad subsistirán durante 2 años desde la aceptación en el Portal, o mientras exista negociación/contrato del Proyecto, lo que ocurra después. Los secretos comerciales se protegen mientras mantengan ese carácter.',
    },
    {
      id: 'law',
      title: '7. Ley aplicable',
      body: 'Leyes de los Estados Unidos Mexicanos. Jurisdicción: tribunales de la Ciudad de México.',
    },
  ],
};

export function getLegalDocument(kind: 'terms' | 'privacy' | 'nda'): LegalDocument {
  if (kind === 'privacy') return PRIVACY_NOTICE;
  if (kind === 'nda') return PORTAL_NDA;
  return TERMS_OF_USE;
}
