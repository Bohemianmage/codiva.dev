import Link from 'next/link';
import InterviewsChrome from '@/components/ops/InterviewsChrome';
import StatusBadge from '@/components/ops/StatusBadge';
import { requireInterviewsAccess } from '@/lib/ops/auth';
import { getAcceptanceStatus } from '@/lib/ops/legal/acceptances';
import { listInterviewQueue } from '@/lib/ops/interview-query';
import { interviewsHref } from '@/lib/ops/interview-view-as';
import { getT } from '@/i18n/locale';
import { jobApplicationStatusLabel } from '@/lib/ops/careers';
import { redirect } from 'next/navigation';

function followUpTone(value: string) {
  if (value === 'pending') return 'warning' as const;
  if (value === 'needs_report') return 'info' as const;
  return 'success' as const;
}

export default async function InterviewsQueuePage() {
  const access = await requireInterviewsAccess();
  if (access.member && !getAcceptanceStatus(access.member).complete) {
    redirect(await interviewsHref('/aceptar'));
  }
  const t = await getT();
  const rows = await listInterviewQueue({
    isStaffPreview: access.isStaffPreview,
    member: access.member,
  });
  const homeHref = await interviewsHref('/');

  return (
    <InterviewsChrome
      isStaffPreview={access.isStaffPreview}
      orgName={access.partner?.name}
      viewAsName={access.isStaffPreview ? access.member?.full_name : null}
    >
      <h1 className="text-xl font-bold text-zinc-900">{t('interviews.queue')}</h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-600">{t('interviews.queueEmpty')}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={homeHref === '/' ? `/${row.id}` : `${homeHref}/${row.id}`}
                className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-codiva-primary/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-900">{row.full_name}</p>
                    {row.jobTitle ? <p className="text-sm text-codiva-primary">{row.jobTitle}</p> : null}
                    <p className="mt-1 text-sm text-zinc-500">{row.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge
                      label={jobApplicationStatusLabel(row.status, t.locale)}
                      tone="info"
                    />
                    <StatusBadge
                      label={
                        row.followUp === 'pending'
                          ? t('interviews.followUpPending')
                          : row.followUp === 'needs_report'
                            ? t('interviews.followUpReport')
                            : t('interviews.followUpClosed')
                      }
                      tone={followUpTone(row.followUp)}
                    />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </InterviewsChrome>
  );
}
