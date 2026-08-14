import { themes } from '@palea/design-tokens';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

describe('mobile Tailwind semantic colors', () => {
  it('exposes camelCase design tokens using the kebab-case class names used by NativeWind', () => {
    const configUrl = pathToFileURL(
      path.resolve(__dirname, 'tailwind.config.mjs'),
    ).href;
    const script = `
      import config from ${JSON.stringify(configUrl)};
      const colors = config.theme.extend.colors;
      console.log(JSON.stringify({
        textMuted: colors['text-muted'], onPrimary: colors['on-primary'],
        primarySubtle: colors['primary-subtle'], dark: colors.dark
      }));
    `;
    const output = execFileSync(
      process.execPath,
      ['--input-type=module', '--eval', script],
      { cwd: __dirname },
    ).toString();
    const colors = JSON.parse(output);

    expect(colors.textMuted).toBe(themes.light.textMuted);
    expect(colors.onPrimary).toBe(themes.light.onPrimary);
    expect(colors.primarySubtle).toBe(themes.light.primarySubtle);
    expect(colors.dark['text-muted']).toBe(themes.dark.textMuted);
    expect(colors.dark['on-primary']).toBe(themes.dark.onPrimary);
    expect(colors.dark['primary-subtle']).toBe(themes.dark.primarySubtle);
  });
});
