'use client';

import { useEffect, useRef, useState } from 'react';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function useHeroScrollProgress() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [dockProgress, setDockProgress] = useState(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const node = ref.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const start = window.scrollY + rect.top;
        const travel = Math.max(1, node.offsetHeight - window.innerHeight);
        setProgress(clamp((window.scrollY - start) / travel));
        setDockProgress(
          clamp(
            (window.scrollY - (start + travel)) / (window.innerHeight * 0.7),
          ),
        );
      });
    };
    const updateViewport = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', updateViewport, { passive: true });
    updateViewport();
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  return { ref, progress, dockProgress, viewport };
}

export function useSectionScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const node = ref.current;
        if (!node) return;
        const travel = node.getBoundingClientRect().height - window.innerHeight;
        setProgress(
          clamp(-node.getBoundingClientRect().top / Math.max(1, travel)),
        );
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return { ref, progress };
}
