import { headers } from 'next/headers';
import StatusScreen from '@/components/ops/StatusScreen';
import { isPortalHost, marketingBaseUrl } from '@/lib/ops/host';

export default async function OpsNotFound() {
  const host = (await headers()).get('host');
  const onPortal = isPortalHost(host);

  if (onPortal) {
    return (
      <StatusScreen
        eyebrow="Codiva Portal"
        code="404"
        title="Página no encontrada"
        description="Este enlace del portal no existe o el proyecto ya no está disponible. Si tienes acceso, usa el enlace de invitación que te enviamos."
        primaryHref={marketingBaseUrl()}
        primaryLabel="Ir a Codiva"
      />
    );
  }

  return (
    <StatusScreen
      eyebrow="Codiva Ops"
      code="404"
      title="Página no encontrada"
      description="Esta ruta no existe en Ops. Vuelve al panel o revisa el enlace."
      primaryHref="/dashboard"
      primaryLabel="Ir al dashboard"
      secondaryHref="/login"
      secondaryLabel="Iniciar sesión"
    />
  );
}
