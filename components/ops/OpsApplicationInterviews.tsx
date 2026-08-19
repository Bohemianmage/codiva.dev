import ToastForm from '@/components/ops/ToastForm';
import {
  addJobInterviewComment,
  addJobInterviewRound,
  updateJobInterviewRound,
} from '@/lib/ops/career-actions';
import {
  JOB_INTERVIEW_KINDS,
  JOB_INTERVIEW_OUTCOMES,
  JOB_INTERVIEW_ROUND_STATUSES,
  isJobInterviewKind,
  isJobInterviewOutcome,
  isJobInterviewRoundStatus,
} from '@/lib/ops/careers';
import type { Translator } from '@/i18n/locale';

export type OpsInterviewStaff = { id: string; full_name: string };

export type OpsInterviewCommentRow = {
  id: string;
  round_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type OpsInterviewRoundRow = {
  id: string;
  application_id: string;
  sort_order: number;
  kind: string;
  title: string;
  status: string;
  outcome: string | null;
  interviewer_id: string | null;
  conducted_at: string | null;
  created_at: string;
};

function staffName(staff: OpsInterviewStaff[], id: string | null) {
  if (!id) return null;
  return staff.find((row) => row.id === id)?.full_name ?? null;
}

function kindLabel(kind: string, t: Translator) {
  if (!isJobInterviewKind(kind)) return kind;
  return t(`ops.careers.interviewKind.${kind}` as const);
}

function statusLabel(status: string, t: Translator) {
  if (!isJobInterviewRoundStatus(status)) return status;
  return t(`ops.careers.interviewRoundStatus.${status}` as const);
}

function outcomeLabel(outcome: string | null, t: Translator) {
  if (!outcome || !isJobInterviewOutcome(outcome)) return null;
  return t(`ops.careers.interviewOutcome.${outcome}` as const);
}

export default function OpsApplicationInterviews({
  applicationId,
  rounds,
  comments,
  staff,
  currentUserId,
  canTeam,
  t,
  formatDate,
}: {
  applicationId: string;
  rounds: OpsInterviewRoundRow[];
  comments: OpsInterviewCommentRow[];
  staff: OpsInterviewStaff[];
  currentUserId: string;
  canTeam: boolean;
  t: Translator;
  formatDate: (date: string | null | undefined) => string;
}) {
  const commentsByRound = new Map<string, OpsInterviewCommentRow[]>();
  for (const row of comments) {
    const list = commentsByRound.get(row.round_id) ?? [];
    list.push(row);
    commentsByRound.set(row.round_id, list);
  }

  const active = rounds.filter((row) => row.status !== 'skipped');
  const done = active.filter((row) => row.status === 'done').length;
  const summary = rounds.length
    ? t('ops.careers.interviewProgress', { done: String(done), total: String(active.length || rounds.length) })
    : t('ops.careers.interviewsTitle');

  return (
    <details className="group mt-3 rounded-lg border border-zinc-200 bg-zinc-50 open:bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100/80 [&::-webkit-details-marker]:hidden">
        {summary}
      </summary>
      <div className="space-y-3 border-t border-zinc-200 px-3 py-3">
        {rounds.length ? (
          <ul className="space-y-3">
            {rounds.map((round) => {
              const roundComments = commentsByRound.get(round.id) ?? [];
              const interviewer = staffName(staff, round.interviewer_id);
              const canComment =
                canTeam || !round.interviewer_id || round.interviewer_id === currentUserId;
              const outcome = outcomeLabel(round.outcome, t);
              return (
                <li key={round.id} className="rounded-lg border border-zinc-200 bg-white p-3">
                  <p className="text-sm font-medium text-zinc-800">{round.title}</p>
                  <p className="text-xs text-zinc-500">
                    {kindLabel(round.kind, t)}
                    {' · '}
                    {statusLabel(round.status, t)}
                    {outcome ? ` · ${outcome}` : ''}
                    {interviewer ? ` · ${interviewer}` : ''}
                    {round.conducted_at ? ` · ${formatDate(round.conducted_at)}` : ''}
                  </p>
                  {roundComments.length ? (
                    <ul className="mt-2 space-y-2">
                      {roundComments.map((comment) => (
                        <li key={comment.id} className="rounded-md bg-zinc-50 px-2.5 py-2 text-sm text-zinc-700">
                          <p className="whitespace-pre-line">{comment.body}</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {staffName(staff, comment.author_id) || t('ops.careers.interviewUnknownAuthor')}
                            {' · '}
                            {formatDate(comment.created_at)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <ToastForm
                    success={t('ops.careers.interviewRoundSaved')}
                    action={async (fd) => {
                      'use server';
                      await updateJobInterviewRound(round.id, fd);
                    }}
                    className="mt-2 grid gap-2 sm:grid-cols-2"
                  >
                    <input
                      name="title"
                      defaultValue={round.title}
                      maxLength={120}
                      required
                      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm sm:col-span-2"
                    />
                    <select
                      name="kind"
                      defaultValue={isJobInterviewKind(round.kind) ? round.kind : 'other'}
                      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                    >
                      {JOB_INTERVIEW_KINDS.map((kind) => (
                        <option key={kind} value={kind}>
                          {kindLabel(kind, t)}
                        </option>
                      ))}
                    </select>
                    <select
                      name="status"
                      defaultValue={
                        isJobInterviewRoundStatus(round.status) ? round.status : 'planned'
                      }
                      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                    >
                      {JOB_INTERVIEW_ROUND_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {statusLabel(value, t)}
                        </option>
                      ))}
                    </select>
                    <select
                      name="outcome"
                      defaultValue={
                        round.outcome && isJobInterviewOutcome(round.outcome) ? round.outcome : ''
                      }
                      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">{t('ops.careers.interviewOutcomeNone')}</option>
                      {JOB_INTERVIEW_OUTCOMES.map((value) => (
                        <option key={value} value={value}>
                          {outcomeLabel(value, t)}
                        </option>
                      ))}
                    </select>
                    <select
                      name="interviewer_id"
                      defaultValue={round.interviewer_id ?? ''}
                      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">{t('ops.careers.interviewUnassigned')}</option>
                      {staff.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.full_name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 sm:col-span-2"
                    >
                      {t('ops.team.save')}
                    </button>
                  </ToastForm>
                  {canComment ? (
                    <ToastForm
                      success={t('ops.careers.interviewCommentSaved')}
                      action={async (fd) => {
                        'use server';
                        await addJobInterviewComment(round.id, fd);
                      }}
                      className="mt-2 space-y-2"
                    >
                      <textarea
                        name="body"
                        required
                        rows={3}
                        maxLength={4000}
                        aria-label={t('ops.careers.interviewCommentPlaceholder')}
                        placeholder={t('ops.careers.interviewCommentPlaceholder')}
                        className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm text-white"
                      >
                        {t('ops.careers.interviewCommentSubmit')}
                      </button>
                    </ToastForm>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">{t('ops.careers.interviewCommentLocked')}</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">{t('ops.careers.interviewsEmpty')}</p>
        )}
        <ToastForm
          success={t('ops.careers.interviewRoundAdded')}
          action={async (fd) => {
            'use server';
            await addJobInterviewRound(applicationId, fd);
          }}
          className="grid gap-2 border-t border-zinc-200 pt-3 sm:grid-cols-2"
        >
          <select
            name="kind"
            defaultValue="screening"
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
          >
            {JOB_INTERVIEW_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kindLabel(kind, t)}
              </option>
            ))}
          </select>
          <select
            name="interviewer_id"
            defaultValue={currentUserId}
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
          >
            <option value="">{t('ops.careers.interviewUnassigned')}</option>
            {staff.map((row) => (
              <option key={row.id} value={row.id}>
                {row.full_name}
              </option>
            ))}
          </select>
          <input
            name="title"
            maxLength={120}
            placeholder={t('ops.careers.interviewTitlePlaceholder')}
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm sm:col-span-2"
          />
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 sm:col-span-2"
          >
            {t('ops.careers.interviewAddRound')}
          </button>
        </ToastForm>
      </div>
    </details>
  );
}
