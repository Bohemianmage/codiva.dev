/**
 * Tecnologías del portfolio: capacidades que un prospecto puede contratar,
 * no el inventario de librerías del repo. Prioridad: dominio (pagos, mapas,
 * CMS, PWA, i18n) → plataforma (Next, Supabase, Stripe) → operación (Vercel, Sentry).
 * Validar con el cliente si se publicitan como stack en producción.
 */
const casesMeta = [
  {
    name: 'Inquilia',
    url: 'https://inquilia.com',
    logo: '/logos/inquilia.webp',
    tech: [
      'Next.js',
      'Supabase',
      'Stripe',
      'AES-256',
      'i18n',
      'Resend',
      'Vercel',
      'Sentry',
    ],
  },
  {
    name: 'CD648',
    url: 'https://cd648.com',
    logo: '/logos/cd648.svg',
    logoFrame: 'landscape',
    tech: [
      'React',
      'Node.js',
      'MongoDB',
      'Stripe',
      'Google Maps API',
      'PWA',
      'i18n',
      'Sentry',
    ],
  },
  {
    name: 'Quimialcla',
    url: 'https://quimialcla.com.mx',
    logo: '/logos/quimialcla.svg',
    logoFrame: 'landscape',
    tech: ['React', 'i18n', 'Vercel', 'Sentry'],
  },
  {
    name: 'Morningstar',
    url: 'https://morningstar.lat',
    logo: '/logos/morningstar.svg',
    tech: [
      'Next.js',
      'Contentful',
      'Stripe',
      'i18n',
      'Vercel',
      'CI/CD',
    ],
  },
  {
    name: 'AMIDA',
    url: 'https://amida.com.mx',
    logo: '/logos/amida.webp',
    logoFrame: 'landscape',
    tech: ['Next.js', 'i18n', 'EmailJS', 'PWA'],
  },
  {
    name: 'Suitable',
    url: 'https://www.suitable.mx',
    logo: '/logos/suitable.svg',
    tech: [
      'Next.js',
      'TypeScript',
      'Supabase',
      'Stripe',
      'Vercel',
      'Sentry',
    ],
  },
  {
    name: 'YOU.',
    url: 'https://www.yousoluciones.com',
    logo: '/logos/you-soluciones-inmobiliarias.svg',
    logoFrame: 'landscape',
    tech: [
      'Next.js',
      'EasyBroker',
      'Google Maps API',
      'PWA',
      'CMS',
      'i18n',
      'Vercel',
      'Sentry',
    ],
  },
];

export default casesMeta;
