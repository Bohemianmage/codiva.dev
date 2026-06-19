'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PortalLoginForm({ slug }: { slug: string }) {
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
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setMessage('Credenciales incorrectas.');
      setLoading(false);
      return;
    }
    router.push(`/p/${slug}`);
    router.refresh();
  }

  const errorMsg =
    error === 'no_access'
      ? 'No tienes acceso a este proyecto.'
      : error === 'not_found'
        ? 'Proyecto no encontrado o no publicado.'
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-codiva-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Contraseña</label>
            <input
              type="password"
              required
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
