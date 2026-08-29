'use client';

import { useEffect, useState } from 'react';
import { BorderBeam } from '../components/BorderBeam';
import { Icon } from '../components/atoms/Icon';
import { Reveal } from '../components/molecules/Reveal';
import { FaqSection } from '../components/organisms/FaqSection';
import { SiteHeader } from '../components/organisms/SiteHeader';
import { SiteFooter } from '../components/organisms/SiteFooter';
import { useSectionScrollProgress } from '../hooks/useScrollProgress';
import { useLocale } from '../providers/LocaleProvider';
import { HeroSection } from '../features/institutional/presentation/HeroSection';

function Dashboard() {
  const { t } = useLocale('web');
  const stats = [
    ['metric.applications', '18', 'board'],
    ['metric.interviews', '4', 'calendar'],
    ['metric.resumes', '3', 'file'],
  ] as const;
  const rows = [
    ['Mercado Nube', 80, 'stage.final'],
    ['Delta Labs', 55, 'stage.technical'],
    ['Correntada', 30, 'stage.applied'],
  ] as const;
  return (
    <div className="dashboard">
      <div className="stats">
        {stats.map(([key, value, icon], i) => (
          <div
            className="stat-card"
            key={key}
            style={{ '--delay': `${i * 0.08}s` } as React.CSSProperties}
          >
            <div>
              {t(key)}
              <span className="stat-icon">
                <Icon name={icon} />
              </span>
            </div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="progress-panel">
        {rows.map(([company, pct, stage]) => (
          <div className="progress-row" key={company}>
            <div className="progress-label">
              <span>{company}</span>
              <small>{t(stage)}</small>
            </div>
            <div className="progress-track">
              <span
                style={{ '--progress': `${pct}%` } as React.CSSProperties}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function ValueProp() {
  const { t } = useLocale('web');
  return (
    <section id="sobre" className="section value-section">
      <div className="section-intro">
        <Reveal>
          <div className="eyebrow">{t('value.eyebrow')}</div>
        </Reveal>
        <Reveal delay={0.05}>
          <h2>{t('value.title')}</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p>{t('value.description')}</p>
        </Reveal>
      </div>
      <Reveal delay={0.15}>
        <Dashboard />
      </Reveal>
    </section>
  );
}

const featureKeys = ['tracking', 'interviews', 'resumes', 'insights'] as const;
function KanbanDemo() {
  const { t } = useLocale('web');
  const [phase, setPhase] = useState<
    'idle' | 'selected' | 'moved' | 'settled' | 'returning'
  >('idle');
  useEffect(() => {
    const timers: number[] = [];
    const schedule = (callback: () => void, delay: number) => {
      timers.push(window.setTimeout(callback, delay));
    };
    const runCycle = () => {
      setPhase('idle');
      schedule(() => setPhase('selected'), 720);
      schedule(() => setPhase('moved'), 1120);
      schedule(() => setPhase('settled'), 2020);
      schedule(() => setPhase('returning'), 3600);
      schedule(runCycle, 4450);
    };
    runCycle();
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);
  return (
    <div className={`kanban-demo is-${phase}`}>
      <div className="kanban-column">
        <div className="kanban-title">
          {t('kanban.applied')} <b>2</b>
        </div>
        <div draggable className="kanban-card">
          <span>{t('kanban.card1')}</span>
          <small>{t('kanban.drag')}</small>
        </div>
      </div>
      <div className="kanban-column">
        <div className="kanban-title">
          {t('kanban.interview')} <b>2</b>
        </div>
        <div className="kanban-card kanban-neighbor-up">
          <span>{t('kanban.card2')}</span>
          <small>{t('kanban.drag')}</small>
        </div>
        <div className="kanban-insertion-slot" aria-hidden="true" />
        <div className="kanban-card kanban-neighbor-down">
          <span>{t('kanban.card1')}</span>
          <small>{t('kanban.drag')}</small>
        </div>
      </div>
      <div className="kanban-column">
        <div className="kanban-title">
          {t('kanban.offer')} <b>1</b>
        </div>
        <div className="kanban-card">
          <span>{t('kanban.card2')}</span>
          <small>{t('kanban.drag')}</small>
        </div>
      </div>
      <div className="kanban-moving-card" aria-hidden="true">
        <span>{t('kanban.card0')}</span>
        <small>{t('kanban.drag')}</small>
      </div>
    </div>
  );
}

function InterviewTimeline({ progress }: { progress: number }) {
  const { t } = useLocale('web');
  const localProgress = Math.max(0, Math.min(1, progress * 3 - 1));
  const activeStage = [0, 0.12, 0.24, 0.38, 0.5].reduce(
    (stage, threshold, index) => (localProgress >= threshold ? index : stage),
    0,
  );
  return (
    <div className="timeline-demo">
      <strong>{t('demo.interview.title')}</strong>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          className={`${i <= activeStage ? 'done' : ''} ${i === activeStage ? 'current' : ''}`}
          key={i}
        >
          <i>{i <= activeStage ? <Icon name="check" /> : i + 1}</i>
          <span>{t(`demo.interview.step${i}`)}</span>
          <small>{i < 4 ? `0${i + 2} mar` : '—'}</small>
        </div>
      ))}
      {activeStage === 4 && (
        <div className="offer-celebration" aria-hidden="true">
          <span className="celebration-confetti confetti-left" />
          <span className="celebration-confetti confetti-top" />
          <span className="celebration-medal">
            <Icon name="check" />
          </span>
          <span className="celebration-confetti confetti-right" />
        </div>
      )}
    </div>
  );
}

function FeatureDemo({ index, progress }: { index: number; progress: number }) {
  const { t } = useLocale('web');
  if (index === 0) return <KanbanDemo />;
  if (index === 1) return <InterviewTimeline progress={progress} />;
  if (index === 2)
    return (
      <div className="resume-demo">
        <strong>{t('demo.resumes.title')}</strong>
        {['CV_Producto.pdf', 'CV_Frontend.pdf', 'CV_General.pdf'].map(
          (name, i) => (
            <div className={i === 0 ? 'selected' : ''} key={name}>
              {i === 0 && (
                <BorderBeam
                  borderWidth={1}
                  colorFrom="var(--web-accent)"
                  colorHighlight="#fff"
                  colorTo="var(--web-data-pink)"
                  duration={7}
                  size={118}
                />
              )}
              <span className="file-icon">
                <Icon name="file" />
              </span>
              <span className="resume-info">
                {name}
                <small>{t(`demo.resumes.tag${i}`)}</small>
              </span>
              {i === 0 && <b>{t('demo.resumes.linked')}</b>}
            </div>
          ),
        )}
      </div>
    );
  return (
    <div className="insights-demo">
      <strong>{t('demo.insights.title')}</strong>
      <div className={`bars ${progress > 0.9 ? 'is-active' : ''}`}>
        {[
          ['42%', 'var(--web-data-blue)'],
          ['68%', 'var(--web-data-green)'],
          ['54%', 'var(--web-data-yellow)'],
          ['86%', 'var(--web-data-indigo)'],
          ['72%', 'var(--web-data-pink)'],
        ].map(([height, color], i) => (
          <i
            key={i}
            style={
              {
                '--bar-height': height,
                '--bar-color': color,
                '--bar-delay': `${i * 130}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <small>{t('demo.insights.caption')}</small>
    </div>
  );
}
function Features() {
  const { t } = useLocale('web');
  const { ref, progress } = useSectionScrollProgress();
  return (
    <section id="funcionalidades" ref={ref} className="features-section">
      <div className="features-sticky">
        <div className="grid-lines" />
        <div className="section-shell">
          <Reveal>
            <div className="eyebrow">{t('features.eyebrow')}</div>
            <h2>{t('features.title')}</h2>
          </Reveal>
          <div className="feature-chips">
            {featureKeys.map((key, i) => (
              <button
                type="button"
                className={
                  Math.round(progress * (featureKeys.length - 1)) === i
                    ? 'active'
                    : ''
                }
                onClick={() => {
                  const section = ref.current;
                  if (!section) return;
                  const top =
                    section.getBoundingClientRect().top + window.scrollY;
                  const travel = Math.max(
                    0,
                    section.offsetHeight - window.innerHeight,
                  );
                  window.scrollTo({
                    top: top + travel * (i / (featureKeys.length - 1)),
                    behavior: 'smooth',
                  });
                }}
                key={key}
              >
                <Icon
                  name={
                    i === 0
                      ? 'board'
                      : i === 1
                        ? 'calendar'
                        : i === 2
                          ? 'file'
                          : 'chart'
                  }
                />
                {t(`features.${key}.chip`)}
              </button>
            ))}
          </div>
          <div
            className="feature-track"
            style={{
              transform: `translateX(-${progress * (featureKeys.length - 1) * 100}%)`,
            }}
          >
            {featureKeys.map((key, i) => (
              <article className="feature-slide" id={`feature-${i}`} key={key}>
                <div>
                  <span className="feature-tag">
                    {t(`features.${key}.chip`)}
                  </span>
                  <h3>{t(`features.${key}.title`)}</h3>
                  <p>{t(`features.${key}.description`)}</p>
                  <a href="#contacto" className="text-link">
                    {t('cta.more')} <Icon name="arrow" />
                  </a>
                </div>
                <div className="feature-demo">
                  <FeatureDemo index={i} progress={progress} />
                </div>
              </article>
            ))}
          </div>
          <div className="feature-progress">
            {featureKeys.map((key, i) => (
              <span
                className={
                  i === Math.round(progress * (featureKeys.length - 1))
                    ? 'active'
                    : ''
                }
                key={key}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useLocale('web');
  return (
    <section id="como-funciona" className="section how-section">
      <div className="section-intro">
        <Reveal>
          <div className="eyebrow">{t('how.eyebrow')}</div>
          <h2>{t('how.title')}</h2>
        </Reveal>
      </div>
      <div className="steps">
        {[0, 1, 2, 3, 4].map((i) => (
          <Reveal delay={i * 0.04} key={i}>
            <article className="step">
              <span className="step-number">{i + 1}</span>
              <div className="step-card">
                <span className="step-icon">
                  <Icon
                    name={
                      i === 0
                        ? 'board'
                        : i === 1
                          ? 'file'
                          : i === 2
                            ? 'board'
                            : i === 3
                              ? 'calendar'
                              : 'chart'
                    }
                  />
                </span>
                <h3>{t(`how.step${i}.title`)}</h3>
                <p>{t(`how.step${i}.description`)}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Platforms() {
  const { t } = useLocale('web');
  return (
    <section id="precios" className="platforms-section">
      <div className="grid-lines" />
      <div className="section-shell">
        <div className="section-intro light">
          <Reveal>
            <div className="eyebrow">{t('platforms.eyebrow')}</div>
            <h2>{t('platforms.title')}</h2>
          </Reveal>
        </div>
        <div className="platform-grid">
          <Reveal className="web-mockup">
            <div className="browser">
              <div className="browser-bar">
                <i />
                <i />
                <i />
                <i className="url">app.palea.com</i>
              </div>
              <div className="browser-body">
                <aside>
                  <strong>
                    <span className="brand-mark">P</span>Palea
                  </strong>
                  {['Panel', 'Postulaciones', 'Entrevistas', 'Currículums'].map(
                    (item, i) => (
                      <span className={i === 1 ? 'selected' : ''} key={item}>
                        {item}
                      </span>
                    ),
                  )}
                </aside>
                <div className="browser-content">
                  <div className="browser-heading">
                    <strong>{t('mockup.title')}</strong>
                    <b>{t('mockup.new')}</b>
                  </div>
                  <div className="mock-columns">
                    {['Postulado', 'Entrevista', 'Oferta'].map((column, i) => (
                      <div key={column}>
                        <small>{column}</small>
                        {Array.from({
                          length: i === 0 ? 3 : i === 1 ? 2 : 1,
                        }).map((_, k) => (
                          <i key={k}>
                            <b />
                            <em />
                          </i>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mockup-cta">
              <span className="availability-chip">
                <i />
                {t('platforms.available')}
              </span>
              <a className="button button-accent button-small" href="#contacto">
                {t('cta.start')} <Icon name="arrow" />
              </a>
            </div>
          </Reveal>
          <Reveal className="mobile-platforms" delay={0.1}>
            <div className="mobile-card">
              <span className="platform-icon" aria-hidden="true">
                <Icon name="google-play" />
              </span>
              <span className="platform-card-copy">
                <strong>Android</strong>
                <small>{t('platforms.comingSoon')}</small>
              </span>
              <span className="platform-status">
                {t('platforms.comingSoon')}
              </span>
            </div>
            <div className="mobile-card">
              <span className="platform-icon" aria-hidden="true">
                <Icon name="apple" />
              </span>
              <span className="platform-card-copy">
                <strong>iOS</strong>
                <small>{t('platforms.comingSoon')}</small>
              </span>
              <span className="platform-status">
                {t('platforms.comingSoon')}
              </span>
            </div>
            <div className="early-access">
              <span className="early-access-icon" aria-hidden="true">
                <Icon name="calendar" />
              </span>
              <span className="platform-card-copy">
                <strong>{t('platforms.earlyAccess')}</strong>
                <small>{t('cta.earlyAccess')}</small>
              </span>
              <a
                href="#contacto"
                className="platform-card-arrow"
                aria-label={t('cta.earlyAccess')}
              >
                <Icon name="arrow" />
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="institutional-site">
      <SiteHeader />
      <main>
        <HeroSection />
        <ValueProp />
        <Features />
        <HowItWorks />
        <Platforms />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  );
}
