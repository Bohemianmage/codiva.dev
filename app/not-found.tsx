import Link from 'next/link';
import { headers } from 'next/headers';
import CodivaWordmarkMark from '@/components/CodivaWordmarkMark';
import StatusScreen from '@/components/ops/StatusScreen';
import Button from '@/components/ui/Button';
import { isCareerHost, isTicketHost, marketingBaseUrl } from '@/lib/ops/host';
import { getT } from '@/i18n/locale';

export default async function NotFound() {
  const t = await getT();
  const host = (await headers()).get('host');
  const quoteOffHost = isCareerHost(host) || isTicketHost(host);

  return (
    <main className="min-h-screen bg-codiva-background font-sans antialiased">
      <StatusScreen
        className="min-h-screen"
        eyebrow={<CodivaWordmarkMark size="sm" />}
        code="404"
        title={t('errors.notFoundTitle')}
        description={t('errors.notFoundBody')}
        actions={
          <>
            <Button as={Link} href="/" size="sm">
              {t('errors.home')}
            </Button>
            {quoteOffHost ? (
              <Button as="a" href={`${marketingBaseUrl()}/cotiza`} variant="secondary" size="sm">
                {t('errors.quoteCta')}
              </Button>
            ) : (
              <Button as={Link} href="/cotiza" variant="secondary" size="sm">
                {t('errors.quoteCta')}
              </Button>
            )}
          </>
        }
      />
    </main>
  );
}
