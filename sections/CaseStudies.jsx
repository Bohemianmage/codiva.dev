import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Heading from '../components/Heading';
import { CaseStudyLogo } from '../components/CaseStudyLogo';
import casesMeta from '../utils/casesMeta';
import TechProjectNetwork from '../components/TechProjectNetwork';
import useMarqueePause from '../hooks/useMarqueePause';
import useMarqueeCopies from '../hooks/useMarqueeCopies';
import { getLogoFrame } from '../utils/logoFrame';

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Variantes de animación
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

export default function CaseStudies() {
  const { t } = useTranslation();
  const [hoveredProject, setHoveredProject] = useState(null);
  const [hoveredTech, setHoveredTech] = useState(null);
  const [logos, setLogos] = useState([]);
  const [techs, setTechs] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const logosMarquee = useMarqueePause();
  const techMarquee = useMarqueePause();
  const logosCopies = useMarqueeCopies(
    logos,
    'gap-6 sm:gap-10 md:gap-14'
  );
  const techCopies = useMarqueeCopies(techs, 'gap-4');

  useEffect(() => {
    setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setLogos(shuffleArray(casesMeta));
  }, []);

  useEffect(() => {
    const techSet = new Set();
    casesMeta.forEach(p => p.tech.forEach(t => techSet.add(t)));
    setTechs(shuffleArray([...techSet]));
  }, []);

  useEffect(() => {
    if (!isMobile || logos.length === 0) return;
    let i = 0;
    const interval = setInterval(() => {
      setHoveredProject(logos[i % logos.length]?.name);
      i++;
    }, 2000);
    return () => clearInterval(interval);
  }, [isMobile, logos]);

  const defaultProject = logos[0]?.name;
  const activeProject = hoveredProject || (isMobile ? defaultProject : null);

  if (logos.length === 0 || techs.length === 0) return null;

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
            <>
              {/* Scroll horizontal manual: la animación se pausa mientras hay gesto/scroll (useMarqueePause) */}
              <div
                ref={(node) => {
                  logosCopies.containerRef.current = node;
                }}
                className="relative w-full overflow-x-auto scrollbar-hidden px-2 sm:px-8 mb-10 touch-pan-x overscroll-x-contain"
                {...logosMarquee.containerProps}
              >
                <div
                  ref={logosCopies.measureRef}
                  className="pointer-events-none absolute left-0 top-0 flex w-max opacity-0 gap-6 sm:gap-10 md:gap-14"
                  aria-hidden
                >
                  {logos.map((item) => {
                    const frame = getLogoFrame(item);
                    return (
                    <div
                      key={`meas-${item.name}`}
                      className="flex flex-shrink-0 items-center justify-center"
                      style={{
                        height: '6rem',
                        minWidth:
                          item.logoFrame === 'landscape'
                            ? `${frame.width / 16}rem`
                            : '6rem',
                      }}
                    >
                      <CaseStudyLogo
                        item={item}
                        alt=""
                        className="h-full w-auto object-contain"
                      />
                    </div>
                  );
                  })}
                </div>
                <div
                  style={logosCopies.marqueeStyle}
                  className={logosMarquee.innerClassName(
                    'flex gap-6 sm:gap-10 md:gap-14 whitespace-nowrap min-w-max will-change-transform animate-scroll-right animate-slow sm:animate-medium lg:animate-fast pb-6 pt-6'
                  )}
                >
                  {logosCopies.flatWithKeys.map(({ item, key }) => {
                    const frame = getLogoFrame(item);
                    return (
                    <a
                      key={key}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={() => setHoveredProject(item.name)}
                      onMouseLeave={() => setHoveredProject(null)}
                      className="flex flex-shrink-0 items-center justify-center"
                      style={{
                        height: '6rem',
                        minWidth:
                          item.logoFrame === 'landscape'
                            ? `${frame.width / 16}rem`
                            : '6rem',
                      }}
                      aria-label={`Go to ${item.name} project`}
                    >
                      <CaseStudyLogo
                        item={item}
                        alt={`${item.name} logo`}
                        className={`h-full w-auto object-contain transition-all duration-300 ${
                          activeProject === item.name
                            ? 'scale-110 drop-shadow-lg'
                            : 'opacity-60 md:opacity-100'
                        }`}
                      />
                    </a>
                  );
                  })}
                </div>
              </div>

              <div
                ref={(node) => {
                  techCopies.containerRef.current = node;
                }}
                className="relative w-full overflow-x-auto scrollbar-hidden touch-pan-x overscroll-x-contain"
                {...techMarquee.containerProps}
              >
                <div
                  ref={techCopies.measureRef}
                  className="pointer-events-none absolute left-0 top-0 flex w-max gap-4 opacity-0"
                  aria-hidden
                >
                  {techs.map((tech) => (
                    <span
                      key={`meas-${tech}`}
                      className="flex-shrink-0 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-sm text-zinc-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div
                  style={techCopies.marqueeStyle}
                  className={techMarquee.innerClassName(
                    'flex gap-4 whitespace-nowrap min-w-max will-change-transform animate-scroll-left animate-slow sm:animate-medium lg:animate-fast'
                  )}
                >
                  {techCopies.flatWithKeys.map(({ item: tech, key }) => {
                    const isHighlighted = activeProject
                      ? casesMeta.find((c) => c.name === activeProject)?.tech.includes(tech)
                      : false;

                    return (
                      <span
                        key={key}
                        role="listitem"
                        onMouseEnter={() => setHoveredTech(tech)}
                        onMouseLeave={() => setHoveredTech(null)}
                        className={`flex-shrink-0 cursor-pointer rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-all duration-300 ease-in-out ${
                          isHighlighted
                            ? 'border-codiva-primary bg-codiva-primary text-white'
                            : 'border-zinc-200 bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {tech}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-12">
              <TechProjectNetwork
                hoveredProject={hoveredProject}
                hoveredTech={hoveredTech}
              />
            </div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}