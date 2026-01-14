'use client';

import { Suspense } from 'react';
import InvitePinContent from './content';

function LoadingContent() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{ backgroundColor: '#FFF9F4' }}
    >
      <div className="w-full max-w-sm text-center">Loading...</div>
    </main>
  );
}

export default function InvitePinPage() {
  return (
    <Suspense fallback={<LoadingContent />}>
      <InvitePinContent />
    </Suspense>
  );
}
