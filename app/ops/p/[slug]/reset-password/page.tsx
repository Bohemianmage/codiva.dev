import ResetPasswordForm from '@/app/ops/reset-password/ResetPasswordForm';

export default async function PortalResetPasswordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ResetPasswordForm loginPath={`/p/${slug}/login`} />;
}
