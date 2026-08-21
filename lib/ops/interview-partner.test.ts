import { describe, expect, it } from 'vitest';
import {
  assignmentMatchesApplication,
  encodeInterviewAssignee,
  interviewFollowUp,
  parseInterviewAssignee,
  parseInterviewViewAsCookie,
  partnerMaySetApplicationStatus,
  visibleApplicationIds,
} from './interview-partner';

const app = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', job_posting_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' };
const round = { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', application_id: app.id };

describe('parseInterviewAssignee', () => {
  it('reads staff and partner prefixes', () => {
    expect(parseInterviewAssignee(`staff:${app.id}`)).toEqual({ kind: 'staff', id: app.id });
    expect(parseInterviewAssignee(`partner:${round.id}`)).toEqual({ kind: 'partner', id: round.id });
    expect(parseInterviewAssignee('')).toEqual({ kind: 'none' });
  });

  it('round-trips encode', () => {
    expect(parseInterviewAssignee(encodeInterviewAssignee({ kind: 'partner', id: round.id }))).toEqual({
      kind: 'partner',
      id: round.id,
    });
  });
});

describe('assignment visibility', () => {
  it('hides applications without an assignment', () => {
    expect(visibleApplicationIds([], [app], [round])).toEqual([]);
  });

  it('matches round, application, or job scope', () => {
    expect(assignmentMatchesApplication({ round_id: round.id }, app, [round])).toBe(true);
    expect(assignmentMatchesApplication({ application_id: app.id }, app, [round])).toBe(true);
    expect(assignmentMatchesApplication({ job_posting_id: app.job_posting_id }, app, [round])).toBe(true);
    expect(
      assignmentMatchesApplication(
        { job_posting_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' },
        app,
        [round]
      )
    ).toBe(false);
  });
});

describe('partner privileges', () => {
  it('never lets a partner set hired or rejected', () => {
    expect(partnerMaySetApplicationStatus('hired')).toBe(false);
    expect(partnerMaySetApplicationStatus('rejected')).toBe(false);
    expect(partnerMaySetApplicationStatus('interview')).toBe(false);
  });
});

describe('parseInterviewViewAsCookie', () => {
  it('accepts a member uuid and rejects junk', () => {
    expect(parseInterviewViewAsCookie(app.id)).toBe(app.id);
    expect(parseInterviewViewAsCookie('')).toBeNull();
    expect(parseInterviewViewAsCookie('staff:abc')).toBeNull();
  });
});

describe('interviewFollowUp', () => {
  it('classifies pending, report, and closed', () => {
    expect(interviewFollowUp({ status: 'planned', reportCount: 0 })).toBe('pending');
    expect(interviewFollowUp({ status: 'done', reportCount: 0 })).toBe('needs_report');
    expect(interviewFollowUp({ status: 'done', reportCount: 1 })).toBe('closed');
    expect(interviewFollowUp({ status: 'skipped', reportCount: 0 })).toBe('closed');
  });
});
