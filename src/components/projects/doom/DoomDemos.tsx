'use client';

import { useLayoutEffect } from 'react';
import { mountDoomPage } from './mount';

// Layout effect so the cleanup runs as the DOM is removed, before any
// animation frame can touch elements that no longer exist.
export default function DoomDemos() {
  useLayoutEffect(() => mountDoomPage(), []);
  return null;
}
