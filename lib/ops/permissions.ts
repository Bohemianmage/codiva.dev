export type StaffRole = 'admin' | 'pm' | 'dev';

export type Capability =
  | 'leads'
  | 'inbox'
  | 'quotes'
  | 'charges'
  | 'portal_users'
  | 'organizations'
  | 'workload'
  | 'time_entries'
  | 'team'
  | 'legal_publish'
  | 'projects_all'
  | 'projects_create'
  | 'milestones_write'
  | 'sprints_plan'
  | 'sprints_update_own'
  | 'documents'
  | 'deliverables'
  | 'site_access'
  | 'tickets'
  | 'dashboard_finance'
  | 'settings_profile';

const ROLE_CAPABILITIES: Record<StaffRole, ReadonlySet<Capability>> = {
  admin: new Set<Capability>([
    'leads',
    'inbox',
    'quotes',
    'charges',
    'portal_users',
    'organizations',
    'workload',
    'time_entries',
    'team',
    'legal_publish',
    'projects_all',
    'projects_create',
    'milestones_write',
    'sprints_plan',
    'sprints_update_own',
    'documents',
    'deliverables',
    'site_access',
    'tickets',
    'dashboard_finance',
    'settings_profile',
  ]),
  pm: new Set<Capability>([
    'leads',
    'inbox',
    'portal_users',
    'organizations',
    'workload',
    'time_entries',
    'projects_create',
    'milestones_write',
    'sprints_plan',
    'sprints_update_own',
    'documents',
    'deliverables',
    'site_access',
    'tickets',
    'settings_profile',
  ]),
  dev: new Set<Capability>([
    'sprints_update_own',
    'time_entries',
    'documents',
    'deliverables',
    'site_access',
    'tickets',
    'settings_profile',
  ]),
};

export function isStaffRole(value: string): value is StaffRole {
  return value === 'admin' || value === 'pm' || value === 'dev';
}

export function can(role: string, capability: Capability): boolean {
  if (!isStaffRole(role)) return false;
  return ROLE_CAPABILITIES[role].has(capability);
}

export function canAny(role: string, capabilities: Capability[]): boolean {
  return capabilities.some((c) => can(role, c));
}

/** Nav items that require a capability (or none = all staff). */
export const NAV_CAPABILITY: Record<string, Capability | null> = {
  '/dashboard': null,
  '/leads': 'leads',
  '/inbox': 'inbox',
  '/projects': null,
  '/workload': 'workload',
  '/organizations': 'organizations',
  '/users': 'portal_users',
  '/tickets': 'tickets',
  '/team': 'team',
  '/settings': 'settings_profile',
};
