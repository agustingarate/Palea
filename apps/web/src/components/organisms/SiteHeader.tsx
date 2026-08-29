'use client';

import { useState, type CSSProperties } from 'react';
import styles from './SiteHeader.module.css';
import { Icon } from '../atoms/Icon';
import { siteNavigation } from '../../content/navigation';
import { useHeaderScroll } from '../../hooks/useHeaderScroll';
import { useLocale } from '../../providers/LocaleProvider';

export function SiteHeader() {
  const { t } = useLocale('web');
  const { scrolled, scrollRatio } = useHeaderScroll();
  const [open, setOpen] = useState(false);

  return (
    <header
      className={`${styles.siteHeader} ${scrolled ? styles.scrolled : ''}`}
      style={{ '--scroll-ratio': scrollRatio } as CSSProperties}
    >
      <div className={styles.headerInner}>
        <nav className={styles.desktopNav} aria-label={t('navigation.label')}>
          {siteNavigation.map(([key, href], index) => (
            <a
              key={href}
              href={href}
              style={
                { '--parallax-target': `${-6 - index * 2}px` } as CSSProperties
              }
            >
              {t(key)}
            </a>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <a className={styles.loginLink} href="#contacto">
            {t('nav.login')}
          </a>
          <a className="button button-primary button-small" href="#precios">
            {t('nav.signup')}
          </a>
          <button
            className={styles.menuButton}
            type="button"
            aria-label={open ? t('menu.close') : t('menu.open')}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((current) => !current)}
          >
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
      <nav
        id="mobile-navigation"
        className={`${styles.mobileNav} ${open ? styles.mobileNavOpen : ''}`}
        aria-label={t('navigation.label')}
        aria-hidden={!open}
        hidden={!open}
      >
        {siteNavigation.map(([key, href]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>
            {t(key)}
          </a>
        ))}
      </nav>
    </header>
  );
}
