'use client';

import useCanvas from '@/lib/use-canvas';

export default function Home() {
  const { lensesGroupRef, wallsGroupRef, sourcesGroupRef } = useCanvas();

  return (
    <main>
      <svg>
        <g ref={lensesGroupRef} />
        <g ref={wallsGroupRef} />
        <g ref={sourcesGroupRef} />
      </svg>
    </main>
  );
}
