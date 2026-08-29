'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import styles from './Reveal.module.css';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** Progressive enhancement: content remains in the document if JS is absent. */
export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          node.dataset.visible = 'true';
          observer.disconnect();
        }
      },
      { rootMargin: '-64px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${className}`}
      style={{ '--delay': `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
