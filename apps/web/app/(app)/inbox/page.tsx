'use client';

import { Suspense } from 'react';
import InboxList from './InboxList';

export default function InboxPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InboxList />
    </Suspense>
  );
}
