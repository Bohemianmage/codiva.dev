'use client';

import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';

export default function FormularioCotizacion() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const sectionOptions = ['start', 'services', 'blog', 'contact'];
  const functionalityOptions = ['login', 'catalog', 'admin', 'pwa', 'blog', 'multilang'];
  const yesNoPartialOptions = ['yes', 'partial', 'no'];

  // Configuración del formulario con validaciones
  const formik = useFormik({
    initialValues: {
      name: '', company: '', email: '', phone: '', need: '',
      sections: [], functionalities: [], hasContent: '',
      hasDomain: '', hasHosting: '', deliveryDate: '',
      budget: '', referenceSite: '', privacyConsent: false,
    },
    validationSchema: Yup.object({
      name: Yup.string().required(t('validation.required')),
      company: Yup.string().required(t('validation.required')),
      email: Yup.string().email(t('validation.invalidEmail')).required(t('validation.required')),
      phone: Yup.string().required(t('validation.required')),
      need: Yup.string().required(t('validation.required')),
      sections: Yup.array().min(1, t('validation.required')),
      functionalities: Yup.array().min(1, t('validation.required')),
      hasContent: Yup.string().required(t('validation.required')),
      hasDomain: Yup.string().required(t('validation.required')),
      hasHosting: Yup.string().required(t('validation.required')),
      deliveryDate: Yup.date().required(t('validation.required')),
      budget: Yup.string(),
      referenceSite: Yup.string()
        .transform((v) => (v === '' ? undefined : v))
        .optional()
        .url(t('validation.invalidUrl')),
      privacyConsent: Yup.boolean().oneOf([true], t('validation.required')),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        if (res.ok) {
          setSubmitted(true);
          resetForm();
        } else {
          const data = await res.json();
          setError(data.error || t('status.error'));
        }
      } catch {
        setError(t('status.error'));
      }
    },
  });

  if (submitted) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-codiva-primary mb-2">{t('status.success')}</h2>
        <p>{t('quote.thankYou')}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-xl space-y-6"
    >

      {/* Datos básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['name', 'company', 'email', 'phone'].map((field) => (
          <div key={field}>
            <label className="block mb-1 text-sm font-medium">{t(`fields.${field}`)}</label>
            <input
              name={field}
              type={field === 'email' ? 'email' : 'text'}
              onChange={formik.handleChange}
              value={formik.values[field]}
              className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-codiva-primary"
            />
            {formik.touched[field] && formik.errors[field] && (
              <p className="text-red-500 text-xs mt-1">{formik.errors[field]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Necesidad */}
      <div>
        <label className="block mb-1 text-sm font-medium">{t('fields.need')}</label>
        <textarea
          name="need"
          rows="4"
          onChange={formik.handleChange}
          value={formik.values.need}
          className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-codiva-primary"
        />
        {formik.touched.need && formik.errors.need && (
          <p className="text-red-500 text-xs mt-1">{formik.errors.need}</p>
        )}
      </div>

      {/* Secciones y funcionalidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">{t('fields.sections')}</label>
          <div className="space-y-1">
            {sectionOptions.map((key) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  name="sections"
                  value={t(`sections.${key}`)}
                  checked={formik.values.sections.includes(t(`sections.${key}`))}
                  onChange={(e) => {
                    const set = new Set(formik.values.sections);
                    e.target.checked ? set.add(e.target.value) : set.delete(e.target.value);
                    formik.setFieldValue('sections', Array.from(set));
                  }}
                  className="mr-2 rounded border-zinc-300 text-codiva-primary focus:ring-codiva-primary"
                />
                {t(`sections.${key}`)}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">{t('fields.functionalities')}</label>
          <div className="space-y-1">
            {functionalityOptions.map((key) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  name="functionalities"
                  value={t(`functionalities.${key}`)}
                  checked={formik.values.functionalities.includes(t(`functionalities.${key}`))}
                  onChange={(e) => {
                    const set = new Set(formik.values.functionalities);
                    e.target.checked ? set.add(e.target.value) : set.delete(e.target.value);
                    formik.setFieldValue('functionalities', Array.from(set));
                  }}
                  className="mr-2 rounded border-zinc-300 text-codiva-primary focus:ring-codiva-primary"
                />
                {t(`functionalities.${key}`)}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Selects */}
      {['hasContent', 'hasDomain', 'hasHosting'].map((field) => (
        <div key={field}>
          <label className="block mb-1 text-sm font-medium">{t(`fields.${field}`)}</label>
          <select
            name={field}
            onChange={formik.handleChange}
            value={formik.values[field]}
            className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-codiva-primary"
          >
            <option value="">{t('fields.selectOption')}</option>
            {(field === 'hasContent' ? yesNoPartialOptions : ['yes', 'no']).map((opt) => (
              <option key={opt} value={t(`options.${opt}`)}>
                {t(`options.${opt}`)}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Fecha, presupuesto y referencia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">{t('fields.deliveryDate')}</label>
          <input
            type="date"
            name="deliveryDate"
            onChange={formik.handleChange}
            value={formik.values.deliveryDate}
            className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-codiva-primary"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">{t('fields.budget')}</label>
          <input
            type="number"
            name="budget"
            onChange={formik.handleChange}
            value={formik.values.budget}
            className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-codiva-primary"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">{t('fields.referenceSite')}</label>
          <input
            type="url"
            name="referenceSite"
            onChange={formik.handleChange}
            value={formik.values.referenceSite}
            className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-codiva-primary"
          />
        </div>
      </div>

      {/* Consentimiento */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="privacyConsent"
          onChange={formik.handleChange}
          checked={formik.values.privacyConsent}
          className="mr-2 rounded border-zinc-300 text-codiva-primary focus:ring-codiva-primary"
        />
        <label className="text-sm">{t('fields.privacyConsent')}</label>
      </div>

      {/* Botón submit */}
      <button
        type="submit"
        className="w-full bg-codiva-primary text-white py-3 rounded-lg hover:bg-[#0c3e3e] transition text-base font-medium"
      >
        {t('buttons.submit')}
      </button>

      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
    </form>
  );
}