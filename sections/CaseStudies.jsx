import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Heading from '../components/Heading';
import casesMeta from '../utils/casesMeta';
import CaseStudiesMobile from '../components/CaseStudiesMobile';

const TechProjectNetwork = dynamic(
  () => import('../components/TechProjectNetwork'),
  { ssr: false }
);

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function CaseStudies() {
  const { t } = useTranslation();
  const [logos, setLogos] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setLogos(shuffleArray(casesMeta));
  }, []);

  if (logos.length === 0) return null;

  return (
    <section
      id="casos"
      className="section-spacing scroll-mt-24 md:scroll-mt-28 w-full px-6 md:px-12 flex flex-col items-center bg-zinc-50"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
        className="w-full max-w-4xl lg:max-w-6xl bg-white rounded-xl shadow-lg px-8 py-12 text-center"
      >
        <motion.div variants={fadeInUp}>
          <Heading
            as="h2"
            id="casos-heading"
            size="text-3xl md:text-4xl"
            className="text-codiva-primary mb-6"
          >
            {t('cases.title')}
          </Heading>
        </motion.div>

        <motion.p
          variants={fadeInUp}
          className="text-zinc-600 text-base md:text-lg mb-10"
        >
          {t('cases.description')}
        </motion.p>

        <motion.div variants={fadeInUp}>
          {isMobile ? (
            <CaseStudiesMobile logos={logos} />
          ) : (
            <div className="mt-12 min-h-[920px]">
              <TechProjectNetwork />
            </div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
