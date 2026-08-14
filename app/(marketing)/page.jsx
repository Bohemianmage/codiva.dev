import Hero from '@/sections/Hero';
import About from '@/sections/About';
import HowWeWork from '@/sections/HowWeWork';
import Services from '@/sections/Services';
import CaseStudies from '@/sections/CaseStudies';
import ContactLazy from '@/sections/ContactLazy';

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
