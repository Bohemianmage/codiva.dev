'use client';

/**
 * i18n: todos los textos provienen de translation.json vía react-i18next.
 * Prioridad: 'Alta' | 'Media' | 'Baja' (valores internos en Codiva Ops).
 */

import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input, { Textarea, Select } from '@/components/ui/Input';

function Field({ formik, label, name, as = 'input', id, ...rest }) {
  const inputId = id || name;
  const error = formik.touched[name] && formik.errors[name];
  const shared = {
    id: inputId,
    name,
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    value: formik.values[name],
    ...rest,
  };

  return (
    <div>
      <label htmlFor={inputId} className="block mb-1 text-sm font-medium text-zinc-800">
        {label}
      </label>

      {as === 'textarea' ? (
        <Textarea {...shared} rows={rest.rows || 4} />
      ) : as === 'select' ? (
        <Select {...shared}>{rest.children}</Select>
      ) : (
        <Input {...shared} />
      )}

      {error && <p className="mt-1 text-xs text-red-600">{formik.errors[name]}</p>}
    </div>
  );
}

export default function TicketPage() {
  const { t } = useTranslation();

  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [files, setFiles] = useState([]);

  const validationSchema = Yup.object({
    name: Yup.string().required(t('common.validation.required')),
    email: Yup.string()
      .email(t('common.validation.invalidEmail'))
      .required(t('common.validation.required')),
    company: Yup.string().required(t('common.validation.required')),
    issueTitle: Yup.string().required(t('common.validation.required')),
    issueDescription: Yup.string()
      .min(10, t('common.validation.tooShort'))
      .required(t('common.validation.required')),
    priority: Yup.mixed().oneOf(['Alta', 'Media', 'Baja']).required(t('common.validation.required')),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      company: '',
      issueTitle: '',
      issueDescription: '',
      priority: 'Media',
      incidentTime: '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setServerError('');
      try {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => fd.append(k, v));
        files.forEach((f) => fd.append('attachments', f));

        const res = await fetch('/api/ticket', { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          setSubmitted(true);
          resetForm();
          setFiles([]);
        } else {
          setServerError(data?.error || t('status.error'));
        }
      } catch {
        setServerError(t('status.error'));
      }
    },
  });

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-xl p-8">
          <h1 className="text-2xl font-semibold mb-2 text-codiva-primary">
            {t('ticket.status.submittedTitle')}
          </h1>
          <p className="text-zinc-700">{t('ticket.status.submittedMsg')}</p>
          <Button type="button" onClick={() => setSubmitted(false)} className="mt-6 w-full">
            {t('ticket.buttons.new')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-codiva-background px-4 py-10 pt-24">
      <Card className="w-full max-w-2xl p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold mb-1 text-codiva-primary">
            {t('ticket.title')}
          </h1>
          <p className="text-sm text-zinc-600">{t('ticket.subtitle')}</p>
        </header>

        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field formik={formik} label={t('common.fields.name')} name="name" type="text" />
            <Field formik={formik} label={t('common.fields.email')} name="email" type="email" />
            <Field formik={formik} label={t('fields.company')} name="company" type="text" />
            <Field formik={formik} label={t('ticket.fields.priority')} name="priority" as="select">
              <option value="Alta">{t('ticket.priority.high')}</option>
              <option value="Media">{t('ticket.priority.medium')}</option>
              <option value="Baja">{t('ticket.priority.low')}</option>
            </Field>
          </div>

          <Field formik={formik} label={t('ticket.fields.issueTitle')} name="issueTitle" type="text" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              formik={formik}
              label={t('ticket.fields.incidentTime')}
              name="incidentTime"
              type="time"
            />
          </div>

          <Field
            formik={formik}
            label={t('ticket.fields.issueDescription')}
            name="issueDescription"
            as="textarea"
            rows={6}
            placeholder={t('ticket.hints.textarea')}
          />

          <div>
            <label className="block mb-1 text-sm font-medium text-zinc-800">
              {t('ticket.fields.attachments')}
            </label>
            <Input
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
              onChange={(e) => {
                const picked = Array.from(e.target.files || []);
                const merged = [...files, ...picked];
                const seen = new Set();
                const unique = [];
                for (const f of merged) {
                  const key = `${f.name}-${f.size}-${f.lastModified}`;
                  if (!seen.has(key)) {
                    seen.add(key);
                    unique.push(f);
                  }
                }
                setFiles(unique);
                e.target.value = '';
              }}
            />

            {files.length > 0 && (
              <div className="mt-2">
                <ul className="space-y-2">
                  {files.map((f, idx) => (
                    <li
                      key={`${f.name}-${f.size}-${idx}`}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    >
                      <span className="truncate">
                        {f.name}{' '}
                        <span className="text-zinc-400">
                          ({(f.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="ml-3 text-red-600 hover:underline"
                        aria-label={`${t('ticket.buttons.remove')} ${f.name}`}
                      >
                        {t('ticket.buttons.remove')}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="text-xs text-zinc-600 hover:underline"
                  >
                    {t('ticket.buttons.removeAll')}
                  </button>
                </div>
              </div>
            )}

            <p className="mt-1 text-xs text-zinc-500">{t('ticket.hints.attachments')}</p>
          </div>

          <Button type="submit" className="w-full" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? t('common.status.loading') : t('ticket.buttons.submit')}
          </Button>

          {serverError && <p className="text-center text-sm text-red-600">{serverError}</p>}
        </form>
      </Card>
    </main>
  );
}
