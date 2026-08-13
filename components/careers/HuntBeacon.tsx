'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { HUNT_SESSION_EVENT } from '@/lib/careers/hunt/cookie';
import { readHuntContext, readHuntCookie, writeHuntCookie } from '@/components/careers/hunt-context';

function huntToken(): string {
  const fromCookie = readHuntCookie();
  if (fromCookie.length >= 16) return fromCookie;
  return readHuntContext()?.token || '';
}

function ping(pathname: string) {
  const token = huntToken();
  if (token.length < 16) return;
  writeHuntCookie(token);
  const body = JSON.stringify({
    token,
    path: pathname || '/',
    host: window.location.hostname,
    referrer: document.referrer || '',
  });
  void fetch('/api/careers/hunt-beacon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    keepalive: true,
    body,
  }).catch(() => {});
}

export default function HuntBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    ping(pathname || '/');
    const onSession = () => ping(pathname || '/');
    window.addEventListener(HUNT_SESSION_EVENT, onSession);
    return () => window.removeEventListener(HUNT_SESSION_EVENT, onSession);
  }, [pathname]);

  return null;
}
