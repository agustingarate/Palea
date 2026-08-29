'use client';

import { Reveal } from '../molecules/Reveal';
import { Icon } from '../atoms/Icon';
import { useLocale } from '../../providers/LocaleProvider';

const footerGroups = ['product', 'resources', 'company', 'legal'] as const;

export function SiteFooter() {
  const { t } = useLocale('web');

  return (
    <footer id="contacto" className="footer">
      <div className="section-shell">
        <Reveal>
          <div className="footer-cta">
            <div className="eyebrow">{t('footer.eyebrow')}</div>
            <h2>{t('footer.title')}</h2>
            <p>{t('footer.description')}</p>
            <div>
              <a className="button button-accent" href="#precios">
                {t('nav.signup')} <Icon name="arrow" />
              </a>
              <a
                className="button button-outline-light"
                href="mailto:hola@palea.app"
              >
                {t('footer.email')}
              </a>
            </div>
          </div>
        </Reveal>
        <div className="footer-grid">
          <div>
            <a className="footer-brand" href="#inicio">
              <span className="brand-mark">P</span>Palea
            </a>
            <p>{t('footer.tagline')}</p>
          </div>
          {footerGroups.map((key) => (
            <div key={key}>
              <strong>{t(`footer.${key}.title`)}</strong>
              {[0, 1, 2].map((i) => (
                <a href="#contacto" key={i}>
                  {t(`footer.${key}.link${i}`)}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Palea</span>
          <span>{t('footer.madeWith')}</span>
        </div>
      </div>
    </footer>
  );
}
