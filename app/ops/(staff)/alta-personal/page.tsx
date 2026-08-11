import { redirect } from 'next/navigation';

export default function AltaPersonalRedirect() {
  redirect('/team?tab=ofertas');
}
