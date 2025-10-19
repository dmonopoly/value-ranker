// src/app/ranking/edit/page.tsx
import { Suspense } from 'react';
import RankingPage from '@/app/(pages)/rankings/new/page';

function LoadingFallback() {
  return <div>Loading edit page...</div>;
}

export default function EditRankingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RankingPage />
    </Suspense>
  );
}