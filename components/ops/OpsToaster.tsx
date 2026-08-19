'use client';

import { Suspense } from 'react';
import OpsFlashToast from '@/components/ops/OpsFlashToast';
import CodivaToaster from '@/components/ui/CodivaToaster';

export default function OpsToaster() {
  return (
    <>
      <CodivaToaster />
      <Suspense fallback={null}>
        <OpsFlashToast />
      </Suspense>
    </>
  );
}
