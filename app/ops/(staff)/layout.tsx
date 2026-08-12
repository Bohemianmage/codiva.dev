import { requireStaff } from '@/lib/ops/auth';
import OpsSidebar from '@/components/ops/OpsSidebar';
import type { StaffRole } from '@/lib/ops/permissions';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await requireStaff();

  return (
    <div className="flex h-screen overflow-hidden">
      <OpsSidebar
        staffName={staff.full_name || 'Staff'}
        staffRole={(staff.role as StaffRole) || 'dev'}
      />
      <main className="min-h-0 flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
