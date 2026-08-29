'use client';

import { useEffect, useState } from 'react';

export function useHeaderScroll() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollRatio, setScrollRatio] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        setScrollRatio(Math.min(1, window.scrollY / 500));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return { scrolled, scrollRatio };
}
