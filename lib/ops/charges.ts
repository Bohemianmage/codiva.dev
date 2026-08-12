import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';
import { tSync } from '@/i18n/translate';
import { formatChargeAmount, formatDate } from '@/lib/ops/labels';

export type ChargeNoticeInput = {
  id: string;
  title: string;
  kind: string;
  amount: number | string | null;
  currency: string;
  status: string;
  due_date: string | null;
  notice_days?: number | null;
  period_label?: string | null;
};

export type ActiveChargeNotice = ChargeNoticeInput & {
  dueDate: string;
  noticeDays: number;
  noticeStartsOn: string;
  daysUntilDue: number;
  isOverdue: boolean;
};

function parseYmd(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function chargeAmountNumber(amount: number | string | null | undefined): number | null {
  if (amount == null || amount === '') return null;
  const n = typeof amount === 'number' ? amount : Number(amount);
  return Number.isFinite(n) ? n : null;
}

/** Avisos activos: desde (due_date - notice_days) hasta vencido, si el cargo sigue pendiente. */
export function getActiveChargeNotices(
  charges: ChargeNoticeInput[],
  today = new Date()
): ActiveChargeNotice[] {
  const todayYmd = toYmd(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())));
  const todayDate = parseYmd(todayYmd);

  return charges
    .filter((c) => c.due_date && (c.status === 'pending' || c.status === 'overdue'))
    .map((c) => {
      const dueDate = c.due_date!.slice(0, 10);
      const noticeDays = Math.max(0, c.notice_days ?? 30);
      const due = parseYmd(dueDate);
      const noticeStartsOn = toYmd(addUtcDays(due, -noticeDays));
      const daysUntilDue = Math.round((due.getTime() - todayDate.getTime()) / 86_400_000);
      return {
        ...c,
        dueDate,
        noticeDays,
        noticeStartsOn,
        daysUntilDue,
        isOverdue: daysUntilDue < 0,
      };
    })
    .filter((c) => todayYmd >= c.noticeStartsOn)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

export function chargeNoticeSummary(
  notice: ActiveChargeNotice,
  locale: Locale = DEFAULT_LOCALE
): string {
  const amountNum = chargeAmountNumber(notice.amount);
  const amountBit =
    amountNum == null
      ? tSync(locale, 'portal.notices.amountTbd')
      : formatChargeAmount(amountNum, notice.currency, locale);
  if (notice.isOverdue) {
    return tSync(locale, 'portal.notices.overdueOn', {
      title: notice.title,
      date: formatDate(notice.dueDate, locale),
      amount: amountBit,
    });
  }
  if (notice.daysUntilDue === 0) {
    return tSync(locale, 'portal.notices.dueToday', {
      title: notice.title,
      amount: amountBit,
    });
  }
  return tSync(locale, 'portal.notices.dueIn', {
    title: notice.title,
    date: formatDate(notice.dueDate, locale),
    days: notice.daysUntilDue,
    amount: amountBit,
  });
}
