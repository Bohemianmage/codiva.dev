import CopyableUrl from '@/components/ops/CopyableUrl';
import { projectPortalUrl } from '@/lib/ops/host';

type Props = {
  slug: string;
  path?: string;
  className?: string;
};

export default function PortalClientUrl({ slug, path = '', className = '' }: Props) {
  return <CopyableUrl href={projectPortalUrl(slug, path)} className={className} />;
}
