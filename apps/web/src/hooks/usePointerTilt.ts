'use client';

import { useRef, useState } from 'react';

export function usePointerTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    setTilt({
      x: (event.clientX - bounds.left) / bounds.width - 0.5,
      y: (event.clientY - bounds.top) / bounds.height - 0.5,
    });
  };

  return {
    ref,
    tilt,
    onPointerMove,
    onPointerLeave: () => setTilt({ x: 0, y: 0 }),
  };
}
