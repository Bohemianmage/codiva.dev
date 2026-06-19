import { requireStaff } from '@/lib/ops/auth';
import OpsSidebar from '@/components/ops/OpsSidebar';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await requireStaff();

  return (
    <div className="flex min-h-screen">
      <OpsSidebar staffName={staff.full_name || 'Staff'} />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
