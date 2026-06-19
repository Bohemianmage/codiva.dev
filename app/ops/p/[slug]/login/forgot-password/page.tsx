import PortalForgotPasswordForm from './PortalForgotPasswordForm';

export default async function PortalForgotPasswordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PortalForgotPasswordForm slug={slug} />;
}
