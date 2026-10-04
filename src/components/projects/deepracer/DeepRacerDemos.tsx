'use client';

import { useEffect } from 'react';

export default function DeepRacerDemos() {
  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    import('./demos').then(({ startDemos }) => {
      if (!cancelled) stop = startDemos();
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return null;
}
