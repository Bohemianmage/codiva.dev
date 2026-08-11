import { redirect } from 'next/navigation';

export default async function AltaPersonalDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/team/ofertas/${id}`);
}
