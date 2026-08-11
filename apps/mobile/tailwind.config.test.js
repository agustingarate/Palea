import { themes } from '@palea/design-tokens';
import config from './tailwind.config.mjs';

describe('mobile Tailwind semantic colors', () => {
  const colors = config.theme.extend.colors;

  it('exposes camelCase design tokens using the kebab-case class names used by NativeWind', () => {
    expect(colors['text-muted']).toBe(themes.light.textMuted);
    expect(colors['on-primary']).toBe(themes.light.onPrimary);
    expect(colors['primary-subtle']).toBe(themes.light.primarySubtle);
    expect(colors.dark['text-muted']).toBe(themes.dark.textMuted);
    expect(colors.dark['on-primary']).toBe(themes.dark.onPrimary);
    expect(colors.dark['primary-subtle']).toBe(themes.dark.primarySubtle);
  });
});
