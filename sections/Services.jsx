import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import {
  Globe,
  Code2,
  Settings,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import Heading from '../components/Heading';
import Paragraph from '../components/Paragraph';

const ICONS = [
  <Globe className="w-5 h-5 text-codiva-primary" />,
  <Code2 className="w-5 h-5 text-codiva-primary" />,
  <Settings className="w-5 h-5 text-codiva-primary" />
];

// Variantes de animación escalonada
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

export default function Services() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [expandedIndex, setExpandedIndex] = useState(null);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { triggerOnce: false, threshold: 0.6 });

  const services = t('services.list', { returnObjects: true });

  return (
    <section
      id="services"
      ref={sectionRef}
      className="section-spacing scroll-mt-24 md:scroll-mt-28 w-full px-6 md:px-12 flex justify-center bg-zinc-50"
    >
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-md px-6 md:px-12 py-12 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <motion.div variants={fadeInUp}>
            <Heading
              as="h2"
              size="text-3xl md:text-4xl"
              className="text-codiva-primary mb-12"
            >
              {t('services.title')}
            </Heading>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left"
          >
            {services.map((service, index) => {
              const isExpanded = expandedIndex === index;
              const detailsId = `service-details-${index}`;
              const price = currentLang === 'es'
                ? ['Desde $28,000 MXN', 'Desde $60,000 MXN', 'Desde $2,000 MXN/h'][index]
                : ['From $1,400 USD', 'From $3,000 USD', 'From $100 USD/h'][index];

              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  className={`relative border ${
                    service.badge ? 'border-codiva-primary/30 bg-codiva-primary/5' : 'border-zinc-100'
                  } rounded-xl p-6 shadow-sm hover:shadow-md hover:scale-[1.015] transition-transform duration-300 flex flex-col justify-between`}
                >
                  {service.badge && (
                    <span className="text-[11px] md:text-xs font-medium text-white bg-codiva-primary px-3 py-1 rounded-full absolute -top-2 -right-2 shadow-sm">
                      {service.badge}
                    </span>
                  )}

                  <div>
                    <h3 className="text-zinc-900 font-semibold text-xl mb-2 flex items-center gap-2">
                      {ICONS[index]}
                      {service.title}
                    </h3>

                    <Paragraph className="text-zinc-700 text-base mb-2">
                      {service.description}
                    </Paragraph>
                  </div>

                  <div className="mt-4">
                    <p
                      className="text-base text-codiva-primary font-semibold mb-3"
                      data-price={price}
                    >
                      {price}
                    </p>

                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                      aria-expanded={isExpanded}
                      aria-controls={detailsId}
                      className="flex items-center gap-1 text-sm text-zinc-600 hover:text-codiva-primary transition"
                    >
                      {isExpanded ? (
                        <>
                          {t('common.buttons.hide')}
                          <motion.div animate={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                            <ChevronUp className="w-4 h-4" />
                          </motion.div>
                        </>
                      ) : (
                        <>
                          {t('common.buttons.seeMore')}
                          <motion.div animate={{ rotate: 0 }} transition={{ duration: 0.3 }}>
                            <ChevronDown className="w-4 h-4" />
                          </motion.div>
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <motion.div
                        id={detailsId}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pl-1 space-y-2"
                      >
                        <ul className="space-y-2">
                          {service.details.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-zinc-600"
                            >
                              <CheckCircle className="text-codiva-primary shrink-0 w-4 h-4 md:w-5 md:h-5 mt-[2px] md:mt-[3px]" />
                              {item}
                            </li>
                          ))}
                        </ul>

                        {service.extras && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-zinc-700 mb-2">
                              {t('services.extrasTitle')}
                            </h4>
                            <ul className="pl-1 space-y-1">
                              {service.extras.map((extra, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                                  <ChevronRight className="text-codiva-primary w-4 h-4 mt-[2px]" />
                                  {extra}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}