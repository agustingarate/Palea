'use client';

import { usePointerTilt } from '../../../hooks/usePointerTilt';
import { useHeroScrollProgress } from '../../../hooks/useScrollProgress';
import { Icon } from '../../../components/atoms/Icon';
import { useLocale } from '../../../providers/LocaleProvider';

function AbstractVisual() {
  const { ref, tilt, onPointerMove, onPointerLeave } = usePointerTilt();
  return (
    <div
      ref={ref}
      className="abstract-visual"
      aria-hidden="true"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="visual-glow" />
      <div
        className="visual-stack"
        style={{
          transform: `rotateX(${tilt.y * -20}deg) rotateY(${tilt.x * 28}deg)`,
        }}
      >
        <span className="orbit orbit-one" />
        <span className="orbit orbit-two" />
        <span className="plate plate-one">
          <i />
          <b />
          <b />
        </span>
        <span className="plate plate-two">
          <i />
          <b />
          <b />
        </span>
        <span className="plate plate-three">
          <i />
          <b />
          <b />
        </span>
        <span className="visual-core" />
      </div>
    </div>
  );
}

export function HeroSection() {
  const { t } = useLocale('web');
  const { ref, progress, dockProgress, viewport } = useHeroScrollProgress();
  const titleProgress = Math.max(0, Math.min(1, (progress - 0.04) / 0.56));
  const wordmarkIn = Math.max(0, Math.min(1, (progress - 0.28) / 0.68));
  const dockTargetX = viewport.width > 900 ? 78 : 62;
  const dockDeltaX = dockTargetX - viewport.width / 2;
  const dockDeltaY = 32 - viewport.height / 2;
  const morphOrigins: Array<[number, number, number]> = [
    [-160, -48, -10],
    [-78, 54, 8],
    [0, -14, -5],
    [82, 46, 7],
    [162, -40, -9],
  ];
  const titleWords = t('hero.title').split(' ');
  return (
    <section id="inicio" ref={ref} className="hero">
      <div className="hero-sticky">
        <div className="grid-lines" />
        <div className="hero-vignette" />
        <div
          className="hero-content"
          style={{ transform: `translateY(${-progress * 28}px)` }}
        >
          <div className="eyebrow-chip hero-eyebrow">
            <span className="status-dot" />
            {t('hero.eyebrow')}
          </div>
          <h1>
            {titleWords.map((word, wordIndex) => {
              const wordOffset = titleWords
                .slice(0, wordIndex)
                .reduce((total, item) => total + item.length + 1, 0);
              return (
                <span className="hero-word" key={`${word}-${wordIndex}`}>
                  {wordIndex > 0 ? ' ' : null}
                  {word.split('').map((char, charIndex) => {
                    const i = wordOffset + charIndex;
                    const [x, y, rotate] = morphOrigins[
                      i % morphOrigins.length
                    ] ?? [0, 0, 0];
                    const compactX =
                      (viewport.width > 900 ? viewport.width * 0.45 : 0) -
                      i * 17 +
                      x * 0.2;
                    return (
                      <span
                        key={`${char}-${i}`}
                        className="hero-letter"
                        style={
                          {
                            '--i': i,
                            transform: `translate(${compactX * titleProgress}px, ${y * titleProgress}px) rotate(${rotate * titleProgress}deg)`,
                            opacity: 1 - titleProgress,
                            filter: `blur(${titleProgress * 5}px)`,
                          } as React.CSSProperties
                        }
                      >
                        {char}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </h1>
          <p>{t('hero.description')}</p>
          <div className="hero-actions">
            <a className="button button-accent" href="#precios">
              {t('cta.start')} <Icon name="arrow" />
            </a>
            <a className="button button-outline-light" href="#sobre">
              {t('cta.learn')}
            </a>
          </div>
        </div>
        <div
          className="hero-visual"
          style={{
            transform: `translate3d(${progress * 34}px, ${-progress * 92}px, 0) scale(${1 - progress * 0.26})`,
            opacity: 1 - progress * 0.12,
          }}
        >
          <AbstractVisual />
        </div>
        <div
          className="scroll-hint"
          style={{ opacity: 1 - Math.min(1, progress * 8) }}
        >
          {t('hero.scroll')}
        </div>
      </div>
      <a
        className={`wordmark-stage ${dockProgress > 0.7 ? 'is-docked' : ''}`}
        href="#inicio"
        aria-label={t('brand.home')}
        aria-hidden={dockProgress < 0.7}
        tabIndex={dockProgress < 0.7 ? -1 : undefined}
      >
        <div
          className="wordmark"
          style={{
            opacity: wordmarkIn,
            color: dockProgress > 0.7 ? 'var(--web-text)' : '#fff',
            transform: `translate(calc(-50% + ${dockDeltaX * dockProgress}px), calc(-50% + ${dockDeltaY * dockProgress}px)) scale(${1 - dockProgress * 0.68})`,
          }}
        >
          {'Palea'.split('').map((char, i) => (
            <span
              key={`${char}-${i}`}
              style={{
                transform: `translate(${(1 - wordmarkIn) * (morphOrigins[i]?.[0] ?? 0)}px, ${(1 - wordmarkIn) * (morphOrigins[i]?.[1] ?? 0)}px) rotate(${(1 - wordmarkIn) * (morphOrigins[i]?.[2] ?? 0)}deg)`,
              }}
            >
              {char}
            </span>
          ))}
        </div>
      </a>
    </section>
  );
}
