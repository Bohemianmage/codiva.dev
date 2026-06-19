'use client';

import Hero from '@/sections/Hero';
import About from '@/sections/About';
import Services from '@/sections/Services';
import CaseStudies from '@/sections/CaseStudies';
import Contact from '@/sections/Contact';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-start w-full px-6 md:px-12">
      <Hero />
      <About />
      <Services />
      <CaseStudies />
      <Contact />
    </main>
  );
}
