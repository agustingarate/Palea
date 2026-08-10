import {
  primitives,
  resolveTheme,
  semanticColorReferences,
  toCssVariables,
  toNativeWindTheme,
  validateTokens,
} from './index';

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(first: string, second: string): number {
  const values = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a,
  );
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

describe('design tokens', () => {
  it('validates primitives, references, and theme parity', () => {
    expect(validateTokens).not.toThrow();
    expect(Object.keys(semanticColorReferences.light).sort()).toEqual(
      Object.keys(semanticColorReferences.dark).sort(),
    );
  });

  it('resolves the approved indigo interaction strategy', () => {
    const light = resolveTheme('light');
    const dark = resolveTheme('dark');
    expect(light.primary).toBe('#070F17');
    expect(light.interaction).toBe('#4E5FD6');
    expect(dark.interaction).toBe('#AAB5FF');
  });

  it('creates CSS and NativeWind adapters from the same source', () => {
    const theme = resolveTheme('light');
    expect(toCssVariables(theme)['--color-interaction-subtle']).toBe('#EEF0FF');
    expect(toNativeWindTheme(theme).colors['on-primary']).toBe('#FFFFFF');
    expect(toNativeWindTheme(theme).spacing).toBe(primitives.spacing);
  });

  it('keeps primary text pairs above WCAG AA contrast', () => {
    for (const mode of ['light', 'dark'] as const) {
      const theme = resolveTheme(mode);
      expect(contrast(theme.text, theme.background)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrast(theme.onPrimary, theme.primary)).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });
});
