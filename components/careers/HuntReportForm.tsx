'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import { readHuntContext, type HuntContext } from '@/components/careers/hunt-context';

type Props = {
  defaultUrl?: string;
  defaultName?: string;
  defaultEmail?: string;
  assessmentToken?: string;
  discipline?: string;
  lockIdentity?: boolean;
  onReported?: (huntReady: boolean | null) => void;
};

export default function HuntReportForm({
  defaultUrl = '',
  defaultName = '',
  defaultEmail = '',
  assessmentToken,
  discipline,
  lockIdentity = false,
  onReported,
}: Props) {
  const { t } = useTranslation();
  const [ctx, setCtx] = useState<HuntContext | null>(null);
  const [fullName, setFullName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [pageUrl, setPageUrl] = useState(defaultUrl);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expected, setExpected] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [keepGoing, setKeepGoing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (assessmentToken) return;
    setCtx(readHuntContext());
  }, [assessmentToken]);

  useEffect(() => {
    const token = assessmentToken || ctx?.token;
    if (!token || defaultName) return;
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/careers/assessments/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (cancelled || !res.ok || !data?.session) return;
      if (data.session.full_name) setFullName(data.session.full_name);
      if (data.session.email) setEmail(data.session.email);
    })();
    return () => {
      cancelled = true;
    };
  }, [assessmentToken, ctx?.token, defaultName]);

  useEffect(() => {
    if (defaultName) setFullName(defaultName);
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail, defaultName]);

  const token = assessmentToken || ctx?.token || '';
  const craft = discipline || ctx?.discipline || '';
  const identityLocked = Boolean(lockIdentity && fullName.trim() && email.includes('@'));

  const canSubmit = useMemo(
    () =>
      fullName.trim() &&
      email.includes('@') &&
      pageUrl.trim() &&
      title.trim().length >= 4 &&
      description.trim().length >= 20,
    [fullName, email, pageUrl, title, description]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/careers/hunt-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          page_url: pageUrl.trim(),
          title: title.trim(),
          description: description.trim(),
          expected: expected.trim() || undefined,
          discipline: craft || undefined,
          assessment_token: token || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'report_failed');
      const ready = typeof data.hunt_ready === 'boolean' ? data.hunt_ready : null;
      onReported?.(ready);
      if (ready === false) {
        setTitle('');
        setDescription('');
        setExpected('');
        setError('');
        setKeepGoing(true);
        return;
      }
      setDone(true);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'rate_limited' || code === 'rate_limited_email') setError(t('career.hunt_error_rate'));
      else if (code === 'duplicate_report') setError(t('career.hunt_error_duplicate'));
      else if (code === 'assessment_not_passed') setError(t('career.assessment_required_error'));
      else setError(t('career.hunt_error'));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-codiva-primary/20 bg-codiva-primary/5 px-5 py-6 text-zinc-900 shadow-sm">
        <p className="font-semibold">{t('career.hunt_success')}</p>
        <p className="mt-2 text-sm text-zinc-600">{t('career.hunt_success_body')}</p>
      </div>
    );
  }

  return (
    <form className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={onSubmit}>
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{t('career.hunt_form_title')}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t('career.hunt_form_intro')}</p>
        {keepGoing ? (
          <p className="mt-2 text-sm text-codiva-primary">{t('career.hunt_keep_going')}</p>
        ) : null}
      </div>
      {!identityLocked ? (
        <>
          <div>
            <label htmlFor="hunt-name" className="mb-1 block text-sm font-medium text-zinc-800">
              {t('career.field_name')}
            </label>
            <Input
              id="hunt-name"
              value={fullName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
              required
              maxLength={200}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="hunt-email" className="mb-1 block text-sm font-medium text-zinc-800">
              {t('career.field_email')}
            </label>
            <Input
              id="hunt-email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              maxLength={320}
              autoComplete="email"
            />
          </div>
        </>
      ) : null}
      <div>
        <label htmlFor="hunt-url" className="mb-1 block text-sm font-medium text-zinc-800">
          {t('career.hunt_field_url')}
        </label>
        <Input
          id="hunt-url"
          value={pageUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPageUrl(e.target.value)}
          required
          maxLength={500}
        />
      </div>
      <div>
        <label htmlFor="hunt-title" className="mb-1 block text-sm font-medium text-zinc-800">
          {t('career.hunt_field_title')}
        </label>
        <Input
          id="hunt-title"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          required
          maxLength={200}
        />
      </div>
      <div>
        <label htmlFor="hunt-desc" className="mb-1 block text-sm font-medium text-zinc-800">
          {t('career.hunt_field_description')}
        </label>
        <Textarea
          id="hunt-desc"
          rows={5}
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          required
          maxLength={8000}
        />
        <p className="mt-1 text-xs text-zinc-500">{t('career.hunt_field_description_hint')}</p>
      </div>
      <div>
        <label htmlFor="hunt-expected" className="mb-1 block text-sm font-medium text-zinc-800">
          {t('career.hunt_field_expected')}
        </label>
        <Textarea
          id="hunt-expected"
          rows={3}
          value={expected}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExpected(e.target.value)}
          maxLength={4000}
        />
      </div>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={!canSubmit || submitting} className="w-full">
        {submitting ? t('career.hunt_submitting') : t('career.hunt_submit')}
      </Button>
    </form>
  );
}
