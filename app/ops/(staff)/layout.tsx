import { requireStaff } from '@/lib/ops/auth';
import OpsSidebar from '@/components/ops/OpsSidebar';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await requireStaff();

  return (
    <div className="flex min-h-screen">
      <OpsSidebar staffName={staff.full_name || 'Staff'} isAdmin={staff.role === 'admin'} />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
