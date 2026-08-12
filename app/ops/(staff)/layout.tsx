import { cookies } from 'next/headers';
import { requireStaff } from '@/lib/ops/auth';
import OpsStaffShell from '@/components/ops/OpsStaffShell';
import { isOpsSidebarOpenCookie, OPS_SIDEBAR_OPEN_COOKIE } from '@/lib/ops/sidebar-pref';
import type { StaffRole } from '@/lib/ops/permissions';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await requireStaff();
  const cookieStore = await cookies();
  const sidebarOpen = isOpsSidebarOpenCookie(cookieStore.get(OPS_SIDEBAR_OPEN_COOKIE)?.value);

  return (
    <OpsStaffShell
      staffName={staff.full_name || 'Staff'}
      staffRole={(staff.role as StaffRole) || 'dev'}
      initialSidebarOpen={sidebarOpen}
    >
      {children}
    </OpsStaffShell>
  );
}
