import dynamic from 'next/dynamic';
import Hero from '@/sections/Hero';
import ContactLazy from '@/sections/ContactLazy';
import { getT } from '@/i18n/locale';

const About = dynamic(() => import('@/sections/About'));
const HowWeWork = dynamic(() => import('@/sections/HowWeWork'));
const Services = dynamic(() => import('@/sections/Services'));
const CaseStudies = dynamic(() => import('@/sections/CaseStudies'));

export async function generateMetadata() {
  const t = await getT();
  const description = t('description');
  return {
    description,
    alternates: { canonical: '/' },
    openGraph: { description },
    twitter: { description },
  };
}

export default function Home() {
  return (
    <main className="flex w-full flex-col items-center justify-start px-6 md:px-12">
      <Hero />
      <About />
      <HowWeWork />
      <Services />
      <CaseStudies />
      <ContactLazy />
    </main>
  );
}
