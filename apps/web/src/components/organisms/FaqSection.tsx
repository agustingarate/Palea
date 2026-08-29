'use client';

import { useState } from 'react';
import { Icon } from '../atoms/Icon';
import { Reveal } from '../molecules/Reveal';
import { useLocale } from '../../providers/LocaleProvider';

export function FaqSection() {
  const { t } = useLocale('web');
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="faq-section">
      <div className="faq-backdrop" />
      <div className="section-shell faq-grid">
        <div className="faq-intro light">
          <Reveal>
            <div className="eyebrow-chip">{t('faq.eyebrow')}</div>
            <h2>{t('faq.title')}</h2>
            <p>{t('faq.description')}</p>
            <a className="button button-dark" href="#contacto">
              {t('cta.contact')} <Icon name="arrow" />
            </a>
          </Reveal>
        </div>
        <Reveal>
          <div className="faq-list">
            {[0, 1, 2, 3, 4].map((i) => {
              const isOpen = open === i;
              return (
                <div className="faq-item" key={i}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span>{t(`faq.q${i}`)}</span>
                    <span
                      aria-hidden="true"
                      className={isOpen ? 'chevron open' : 'chevron'}
                    >
                      ⌄
                    </span>
                  </button>
                  <div
                    id={`faq-answer-${i}`}
                    hidden={!isOpen}
                    className={isOpen ? 'faq-answer open' : 'faq-answer'}
                  >
                    <p>{t(`faq.a${i}`)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
