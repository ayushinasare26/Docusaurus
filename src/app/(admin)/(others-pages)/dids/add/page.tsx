import React, { Suspense } from 'react';
import AddDidClient from './AddDidClient';

export default function AddDidPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"></div>
        </div>
      }
    >
      <AddDidClient />
    </Suspense>
  );
}
