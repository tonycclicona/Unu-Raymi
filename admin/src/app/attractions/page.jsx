'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AttractionsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/attractions/create');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a5759]"></div>
    </div>
  );
}
