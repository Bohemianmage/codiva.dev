'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const Contact = dynamic(() => import('./Contact'), { ssr: false });

export default function ContactLazy() {
  const ref = useRef(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: '280px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full">
      {load ? (
        <Contact />
      ) : (
        <section
          id="contact"
          className="section-spacing scroll-mt-24 md:scroll-mt-28 flex w-full justify-center bg-zinc-50 px-6 md:px-12"
          aria-hidden
        >
          <div className="min-h-[28rem] w-full max-w-2xl rounded-xl bg-white px-6 py-12 shadow-md md:px-12" />
        </section>
      )}
    </div>
  );
}
