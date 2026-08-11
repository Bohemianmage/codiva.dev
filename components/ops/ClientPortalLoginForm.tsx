'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export default function ClientPortalLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const toastId = toast.loading('Entrando…');

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      const msg =
        authError.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos.'
          : authError.message;
      setMessage(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
      return;
    }

    if (!data.user) {
      const msg = 'No se pudo iniciar sesión.';
      setMessage(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
      return;
    }

    const { data: memberships } = await supabase
      .from('project_members')
      .select('id, projects!inner(id, client_visible)')
      .eq('user_id', data.user.id);

    const hasVisible = (memberships ?? []).some((row) => {
      const raw = row.projects as { client_visible?: boolean } | { client_visible?: boolean }[] | null;
      const p = Array.isArray(raw) ? raw[0] : raw;
      return p?.client_visible === true;
    });

    if (!hasVisible) {
      await supabase.auth.signOut();
      const msg = 'No tienes acceso a ningún proyecto publicado.';
      setMessage(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
      return;
    }

    toast.success('Bienvenido', { id: toastId });
    router.push('/proyectos');
    router.refresh();
  }

  const errorMsg =
    error === 'no_access'
      ? 'No tienes acceso a este portal.'
      : error === 'auth'
        ? 'Enlace inválido o expirado.'
        : message;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-codiva-primary">Codiva</p>
        <h1 className="mt-2 text-2xl font-bold">Portal del cliente</h1>
        <p className="mt-1 text-sm text-zinc-600">Ingresa con las credenciales que te enviamos</p>

        {errorMsg && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-codiva-primary/30"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium">Contraseña</label>
              <Link href="/login/forgot-password" className="text-xs text-codiva-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-codiva-primary/30"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-codiva-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar al portal'}
          </button>
        </form>
      </div>
    </div>
  );
}
