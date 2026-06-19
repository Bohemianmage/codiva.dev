import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import StatusBadge from '@/components/ops/StatusBadge';
import { requireStaff } from '@/lib/ops/auth';
import { updateInboxStatus, convertInboxToLead } from '@/lib/ops/actions';
import { INBOX_STATUS_LABELS, formatDate } from '@/lib/ops/labels';

export default async function InboxPage() {
  const { supabase } = await requireStaff();
  const { data: messages } = await supabase
    .from('inbox_messages')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <OpsPageHeader title="Inbox" description="Mensajes del formulario de contacto" />
      <div className="space-y-4">
        {(messages ?? []).map((m) => {
          async function onStatus(formData: FormData) {
            'use server';
            await updateInboxStatus(m.id, String(formData.get('status')));
          }

          async function onConvertToLead() {
            'use server';
            const result = await convertInboxToLead(m.id);
            const { redirect } = await import('next/navigation');
            redirect(`/leads/${result.leadId}`);
          }

          return (
            <article key={m.id} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{m.name}</h2>
                  <p className="text-sm text-zinc-500">{m.email} · {formatDate(m.created_at)}</p>
                </div>
                <StatusBadge
                  label={INBOX_STATUS_LABELS[m.status]}
                  tone={m.status === 'unread' ? 'info' : 'neutral'}
                />
              </div>
              <p className="text-sm whitespace-pre-wrap text-zinc-700">{m.message}</p>
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <form action={onStatus} className="flex items-end gap-2">
                  <select name="status" defaultValue={m.status} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
                    {Object.entries(INBOX_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
                    Guardar
                  </button>
                </form>
                {m.lead_id ? (
                  <Link
                    href={`/leads/${m.lead_id}`}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                  >
                    Ver lead
                  </Link>
                ) : (
                  <form action={onConvertToLead}>
                    <button type="submit" className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm font-semibold text-white">
                      Convertir a lead
                    </button>
                  </form>
                )}
              </div>
            </article>
          );
        })}
        {!messages?.length && <p className="text-sm text-zinc-500">Sin mensajes</p>}
      </div>
    </div>
  );
}
