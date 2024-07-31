import { useEffect, useRef } from 'react';
import { DataModel } from '@/lib/types';

export default function useCanvas() {
  const lensesGroupRef = useRef<SVGGElement>(null);
  const sourcesGroupRef = useRef<SVGGElement>(null);
  const wallsGroupRef = useRef<SVGGElement>(null);

  const dataRef = useRef<DataModel>({
    lenses: [],
    sources: [],
    walls: []
  });

  useEffect(() => {
    const lensesGroup = lensesGroupRef.current!;
    const sourcesGroup = sourcesGroupRef.current!;
    const wallsGroup = wallsGroupRef.current!;
    const data = dataRef.current;

    function addSource() {
      dataRef
    }
  }, []);

  return { lensesGroupRef, sourcesGroupRef, wallsGroupRef };
}
