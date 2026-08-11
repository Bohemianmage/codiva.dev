'use client';

import { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import OpsFlashToast from '@/components/ops/OpsFlashToast';

export default function OpsToaster() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'text-sm',
          success: { className: 'text-sm' },
          error: { className: 'text-sm' },
        }}
      />
      <Suspense fallback={null}>
        <OpsFlashToast />
      </Suspense>
    </>
  );
}
