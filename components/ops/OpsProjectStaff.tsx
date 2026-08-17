import ToastForm from '@/components/ops/ToastForm';
import { assignProjectStaff, removeProjectStaff } from '@/lib/ops/actions';
import { EMPTY_LABEL } from '@/lib/ops/labels';
import { can } from '@/lib/ops/permissions';

type StaffOption = { id: string; full_name: string; role: string };
type ProjectStaffRow = {
  staff_id: string;
  role_on_project: string;
  staff_profiles: { full_name: string; role: string } | { full_name: string; role: string }[] | null;
};

function profileName(row: ProjectStaffRow) {
  const p = Array.isArray(row.staff_profiles) ? row.staff_profiles[0] : row.staff_profiles;
  return p?.full_name || EMPTY_LABEL;
}

export default function OpsProjectStaff({
  projectId,
  staffRole,
  projectStaff,
  allStaff,
}: {
  projectId: string;
  staffRole: string;
  projectStaff: ProjectStaffRow[];
  allStaff: StaffOption[];
}) {
  const canPlan = can(staffRole, 'sprints_plan');
  const assignedIds = new Set(projectStaff.map((row) => row.staff_id));
  const available = allStaff.filter((s) => !assignedIds.has(s.id));

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="mb-1 font-semibold">Equipo interno</h2>
      <p className="mb-4 text-sm text-zinc-500">
        Quien esté asignado puede ver todo el expediente de este proyecto: sprints, documentos,
        tickets, cotizaciones, pagos y portal.
      </p>
      <ul className="mb-4 space-y-2">
        {projectStaff.map((row) => (
          <li
            key={row.staff_id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2 text-sm"
          >
            <span>
              {profileName(row)}{' '}
              <span className="text-zinc-500">· {row.role_on_project}</span>
            </span>
            {canPlan ? (
              <ToastForm
                success="Quitado"
                action={async () => {
                  'use server';
                  await removeProjectStaff(projectId, row.staff_id);
                }}
              >
                <button type="submit" className="text-xs text-zinc-500 hover:text-red-600">
                  Quitar
                </button>
              </ToastForm>
            ) : null}
          </li>
        ))}
        {!projectStaff.length && <p className="text-sm text-zinc-500">Nadie asignado aún.</p>}
      </ul>
      {canPlan && available.length > 0 ? (
        <ToastForm
          success="Asignado"
          action={async (fd) => {
            'use server';
            await assignProjectStaff(projectId, fd);
          }}
          className="flex flex-wrap gap-2"
        >
          <select name="staffId" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="">Seleccionar staff</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name || s.id.slice(0, 8)} ({s.role})
              </option>
            ))}
          </select>
          <select name="roleOnProject" defaultValue="pm" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="pm">PM</option>
            <option value="dev">Dev</option>
            <option value="member">Member</option>
          </select>
          <button type="submit" className="rounded-lg bg-codiva-primary px-3 py-2 text-sm text-white">
            Asignar
          </button>
        </ToastForm>
      ) : null}
    </section>
  );
}
