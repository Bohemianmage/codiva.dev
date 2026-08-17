import { sendClientEmail } from '@/lib/ops/email';
import {
  templateCareerApplicationPhaseChanged,
  templateCareerApplicationRejected,
} from '@/lib/ops/email-templates';
import { publicCareerListUrl, type JobApplicationStatus } from '@/lib/ops/careers';
import { tSync } from '@/i18n/translate';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';

const NOTIFY_STATUSES = ['reviewed', 'interview', 'hired', 'rejected'] as const;
type NotifyStatus = (typeof NOTIFY_STATUSES)[number];

function isNotifyStatus(status: JobApplicationStatus): status is NotifyStatus {
  return (NOTIFY_STATUSES as readonly string[]).includes(status);
}

function prefixFor(status: NotifyStatus): string {
  if (status === 'rejected') return 'email.careerRejected';
  if (status === 'hired') return 'email.careerHired';
  if (status === 'interview') return 'email.careerInterview';
  return 'email.careerReviewed';
}

export async function notifyCandidateApplicationStatus(input: {
  email: string;
  name: string;
  jobTitle: string;
  status: JobApplicationStatus;
  locale?: Locale;
}): Promise<void> {
  if (!isNotifyStatus(input.status)) return;
  const email = String(input.email || '').trim().toLowerCase();
  const name = String(input.name || '').trim();
  const jobTitle = String(input.jobTitle || '').trim();
  if (!email || !name || !jobTitle) return;

  const locale = input.locale ?? DEFAULT_LOCALE;
  const prefix = prefixFor(input.status);

  await sendClientEmail({
    to: email,
    subject: tSync(locale, `${prefix}.subject`, { jobTitle }),
    html:
      input.status === 'rejected'
        ? templateCareerApplicationRejected({
            name,
            jobTitle,
            openingsHref: publicCareerListUrl(),
            locale,
          })
        : templateCareerApplicationPhaseChanged({
            name,
            jobTitle,
            kind: input.status,
            locale,
          }),
  }).catch(() => {});
}
