'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  ALL_CAPABILITIES,
  CAPABILITY_GROUPS,
  capabilitiesFromRole,
  capabilityListEquals,
  diffCapabilities,
  isCapability,
  isStaffRole,
  type Capability,
  type StaffRole,
} from '@/lib/ops/permissions';

function asSet(list: readonly Capability[]): Set<Capability> {
  return new Set(list);
}

export default function OpsStaffCapabilityFields({
  name = 'capabilities',
  roleName = 'role',
  defaultRole,
  defaultCapabilities,
  lockTeam = false,
  defaultOpen = false,
}: {
  name?: string;
  roleName?: string;
  defaultRole: string;
  defaultCapabilities?: string[] | null;
  lockTeam?: boolean;
  defaultOpen?: boolean;
}) {
  const { t } = useTranslation();
  const initialRole = isStaffRole(defaultRole) ? defaultRole : 'pm';
  const [role, setRole] = useState<StaffRole>(initialRole);
  const [selected, setSelected] = useState<Set<Capability>>(() => {
    const fromProfile = (defaultCapabilities ?? []).filter(isCapability);
    return new Set(fromProfile.length ? fromProfile : capabilitiesFromRole(initialRole));
  });

  const template = useMemo(() => asSet(capabilitiesFromRole(role)), [role]);
  const selectedList = useMemo(
    () => ALL_CAPABILITIES.filter((cap) => selected.has(cap)),
    [selected]
  );
  const customized = !capabilityListEquals(selectedList, [...template]);
  const { extra, missing } = useMemo(
    () => diffCapabilities(selected, template),
    [selected, template]
  );
  const extraSet = useMemo(() => new Set(extra), [extra]);
  const visibleTotal = ALL_CAPABILITIES.length - 1;
  const visibleCount = Math.max(0, selectedList.filter((cap) => cap !== 'settings_profile').length);
  const [open, setOpen] = useState(defaultOpen);

  function isLocked(cap: Capability) {
    return cap === 'settings_profile' || (cap === 'team' && lockTeam && selected.has('team'));
  }

  function toggle(cap: Capability) {
    if (isLocked(cap)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cap)) next.delete(cap);
      else next.add(cap);
      next.add('settings_profile');
      return next;
    });
  }

  function applyTemplate(nextRole: StaffRole = role) {
    setRole(nextRole);
    setSelected(asSet(capabilitiesFromRole(nextRole)));
  }

  function onRoleChange(next: StaffRole) {
    const matchesCurrent = capabilityListEquals(selectedList, capabilitiesFromRole(role));
    setRole(next);
    if (matchesCurrent) setSelected(asSet(capabilitiesFromRole(next)));
  }

  function setGroup(caps: readonly Capability[], on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const cap of caps) {
        if (cap === 'settings_profile') continue;
        if (cap === 'team' && lockTeam && prev.has('team') && !on) continue;
        if (on) next.add(cap);
        else next.delete(cap);
      }
      next.add('settings_profile');
      return next;
    });
  }

  return (
    <div className="space-y-3 sm:col-span-3">
      <label className="block text-sm font-medium text-zinc-700">
        {t('ops.settings.role')}
        <select
          name={roleName}
          value={role}
          onChange={(e) => {
            const next = e.target.value;
            if (isStaffRole(next)) onRoleChange(next);
          }}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal"
        >
          <option value="admin">{t('ops.roles.admin')}</option>
          <option value="pm">{t('ops.roles.pm')}</option>
          <option value="dev">{t('ops.roles.dev')}</option>
        </select>
      </label>

      <details
        className="group rounded-lg border border-zinc-200 bg-zinc-50 open:bg-white"
        open={open}
        onToggle={(e) => setOpen(e.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-100/80 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-zinc-800">{t('ops.team.permissionsTitle')}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  customized ? 'bg-amber-50 text-amber-800' : 'bg-zinc-200/80 text-zinc-600'
                }`}
              >
                {customized ? t('ops.team.permissionsCustom') : t('ops.team.permissionsTemplate')}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              {t('ops.team.permissionsCount', { count: visibleCount, total: visibleTotal })}
              {extra.length > 0 ? ` · ${t('ops.team.permissionsExtraCount', { count: extra.length })}` : ''}
              {missing > 0 ? ` · ${t('ops.team.permissionsMissingCount', { count: missing })}` : ''}
            </p>
          </div>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-zinc-400 transition group-open:rotate-180"
            aria-hidden
          />
        </summary>

        <div className="space-y-3 border-t border-zinc-200 px-3 py-3">
          <p className="text-xs text-zinc-500">{t('ops.team.permissionsHint')}</p>
          {customized ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs text-amber-900">{t('ops.team.permissionsMismatch')}</p>
              <button
                type="button"
                onClick={() => applyTemplate()}
                className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-50"
              >
                {t('ops.team.permissionsApplyTemplate')}
              </button>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {CAPABILITY_GROUPS.map((group) => {
              const caps = group.capabilities.filter((cap) => cap !== 'settings_profile');
              const onCount = caps.filter((cap) => selected.has(cap)).length;
              return (
                <fieldset
                  key={group.id}
                  aria-label={t(`ops.capabilities.groups.${group.id}`)}
                  className="rounded-lg border border-zinc-200 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {t(`ops.capabilities.groups.${group.id}`)}
                      <span className="ml-1 font-medium normal-case tracking-normal text-zinc-400">
                        {onCount}/{caps.length}
                      </span>
                    </p>
                    <span className="flex gap-1">
                      <button
                        type="button"
                        className="rounded px-1.5 py-0.5 text-[11px] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                        onClick={() => setGroup(caps, true)}
                      >
                        {t('ops.team.permissionsGroupAll')}
                      </button>
                      <button
                        type="button"
                        className="rounded px-1.5 py-0.5 text-[11px] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                        onClick={() => setGroup(caps, false)}
                      >
                        {t('ops.team.permissionsGroupNone')}
                      </button>
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {caps.map((cap) => {
                      const locked = isLocked(cap);
                      return (
                        <label key={cap} className="flex items-start gap-2 text-sm text-zinc-700">
                          <input
                            type="checkbox"
                            name={name}
                            value={cap}
                            checked={selected.has(cap)}
                            disabled={locked}
                            onChange={() => toggle(cap)}
                            className="mt-0.5"
                          />
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-1.5">
                              {t(`ops.capabilities.${cap}`)}
                              {extraSet.has(cap) ? (
                                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                  {t('ops.team.permissionsExtra')}
                                </span>
                              ) : null}
                            </span>
                            {locked ? (
                              <span className="block text-xs text-zinc-400">
                                {t('ops.team.permissionsLocked')}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>
          <p className="text-[11px] text-zinc-400">{t('ops.team.permissionsProfileAlways')}</p>
        </div>
      </details>

      {selected.has('settings_profile') ? (
        <input type="hidden" name={name} value="settings_profile" />
      ) : null}
      {lockTeam && selected.has('team') ? <input type="hidden" name={name} value="team" /> : null}
    </div>
  );
}
