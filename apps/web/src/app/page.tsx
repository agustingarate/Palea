'use client';

import { useLocale } from '../providers/LocaleProvider';

export default function HomePage() {
  const { t } = useLocale('web');
  const principles = [
    [t('principle.clarity.title'), t('principle.clarity.description')],
    [t('principle.calm.title'), t('principle.calm.description')],
    [
      t('principle.progress.title'),
      t('principle.progress.description'),
    ],
  ] as const;
  return (
    <main>
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6"
        aria-label={t('navigation.label')}
      >
        <span className="text-xl font-bold tracking-tight">Palea</span>
        <span className="text-sm text-muted">{t('comingSoon')}</span>
      </nav>
      <section className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted">
            {t('eyebrow')}
          </p>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            {t('hero.description')}
          </p>
          <a
            className="mt-8 inline-flex min-h-12 items-center rounded-card bg-primary px-6 font-semibold text-on-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            href="mailto:hola@palea.app"
          >
            {t('cta')}
          </a>
        </div>
        <div className="rounded-[20px] border border-border bg-surface p-6 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          <p className="text-sm font-medium text-muted">
            {t('card.label')}
          </p>
          <div className="mt-5 grid gap-3">
            {principles.map(([title, text]) => (
              <article
                className="rounded-card border border-border p-4"
                key={title}
              >
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
