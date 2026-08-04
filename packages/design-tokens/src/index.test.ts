import {
  resolveTheme,
  semanticColorReferences,
  toCssVariables,
  validateTokens,
} from './index';

describe('design tokens', () => {
  it('validates primitive references and theme parity', () => {
    expect(validateTokens).not.toThrow();
    expect(Object.keys(semanticColorReferences.light).sort()).toEqual(
      Object.keys(semanticColorReferences.dark).sort(),
    );
  });

  it('resolves semantic colors and CSS variables', () => {
    const theme = resolveTheme('light');
    expect(theme.primary).toBe('#070F17');
    expect(toCssVariables(theme)['--color-primary-subtle']).toBe('#E1E7EF');
  });
});
