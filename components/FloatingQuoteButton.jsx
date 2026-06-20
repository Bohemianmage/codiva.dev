'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Mail, MessageCircle } from 'lucide-react'; 

export default function FloatingQuoteButton() {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const router = useRouter();

  // Cerrar modal con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setShowForm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cerrar modal al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setOpen(false);
        setShowForm(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Validación del formulario
  const validationSchema = Yup.object({
    name: Yup.string().required(t('common.validation.required')),
    projectType: Yup.string().required(t('common.validation.required')),
    message: Yup.string().min(10, t('common.validation.tooShort')),
  });

  return (
    <>
      {/* Botón flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-codiva-primary text-white px-5 py-3 rounded-full shadow-lg text-sm font-medium hover:bg-codiva-primary-dark transition"
        >
          {t('quote.button')}
        </motion.button>
      </div>

      {/* Modal principal */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          >
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              transition={{ duration: 0.3 }}
              className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 relative"
            >
              <button
                onClick={() => {
                  setOpen(false);
                  setShowForm(false);
                }}
                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

             {!showForm ? (
  <div className="space-y-5 text-center">
    <h2 className="text-lg font-semibold text-zinc-800">
      {t('quote.promptTitle')}
    </h2>
    <p className="text-sm text-zinc-600">
      {t('quote.promptSubtitle')}
    </p>

    <div className="space-y-3 mt-6">
      <button
        onClick={() => {
          setOpen(false);
          router.push('/cotiza');
        }}
        className="w-full border-2 border-codiva-primary text-codiva-primary py-2.5 rounded-lg hover:bg-codiva-primary hover:text-white transition font-medium flex items-center justify-center gap-2"
      >
        <Mail className="w-4 h-4" />
        {t('quote.knowWhatIWant')}
      </button>

      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-codiva-primary text-white py-2.5 rounded-xl hover:bg-codiva-primary-dark transition font-medium flex items-center justify-center gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        {t('quote.needHelp')}
      </button>
    </div>
  </div>
) : (
                // Formulario para enviar a WhatsApp
                <Formik
                  initialValues={{ name: '', projectType: '', message: '' }}
                  validationSchema={validationSchema}
                  onSubmit={(values) => {
                    const { name, projectType, message } = values;
                    const text = `¡Hola! Me gustaría recibir una cotización.\n\n👤 *${t('common.fields.name')}:* ${name}\n💼 *${t('common.fields.projectType')}:* ${projectType}\n📝 *${t('common.fields.message')}:* ${message || 'N/A'}`;
                    const url = `https://wa.me/5215566819736?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                    setOpen(false);
                    setShowForm(false);
                  }}
                >
                  {() => (
                    <Form className="space-y-4 text-sm text-zinc-800">
                      <div>
                        <label htmlFor="name" className="block mb-1 font-medium">
                          {t('common.fields.name')}
                        </label>
                        <Field
                          name="name"
                          className="w-full border border-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-codiva-primary"
                        />
                        <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                      </div>

                      <div>
                        <label htmlFor="projectType" className="block mb-1 font-medium">
                          {t('common.fields.projectType')}
                        </label>
                        <Field
                          as="select"
                          name="projectType"
                          className="w-full border border-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-codiva-primary"
                        >
                          <option value="">{t('quote.fields.selectOption')}</option>
                          <option value={t('quote.fields.options.webEssentials')}>
                            {t('quote.fields.options.webEssentials')}
                          </option>
                          <option value={t('quote.fields.options.appsSystems')}>
                            {t('quote.fields.options.appsSystems')}
                          </option>
                          <option value={t('quote.fields.options.continuousCare')}>
                            {t('quote.fields.options.continuousCare')}
                          </option>
                          <option value={t('quote.fields.options.other')}>
                            {t('quote.fields.options.other')}
                          </option>
                        </Field>
                        <ErrorMessage name="projectType" component="div" className="text-red-500 text-xs mt-1" />
                      </div>

                      <div>
                        <label htmlFor="message" className="block mb-1 font-medium">
                          {t('common.fields.message')}
                        </label>
                        <Field
                          as="textarea"
                          name="message"
                          rows="4"
                          className="w-full border border-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-codiva-primary"
                        />
                        <ErrorMessage name="message" component="div" className="text-red-500 text-xs mt-1" />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-codiva-primary text-white py-2.5 rounded-xl hover:bg-codiva-primary-dark transition font-medium"
                      >
                        {t('common.buttons.submit')}
                      </button>
                    </Form>
                  )}
                </Formik>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}