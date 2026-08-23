import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { themes } from '@palea/design-tokens';

function loadTailwindColors() {
  const url = pathToFileURL(
    path.resolve(__dirname, 'tailwind.config.mjs'),
  ).href;
  const script = `const { default: config } = await import(${JSON.stringify(url)}); console.log(JSON.stringify(config.theme.extend.colors));`;
  return JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      encoding: 'utf8',
    }),
  );
}

describe('mobile Tailwind semantic colors', () => {
  it('exposes camelCase design tokens using the kebab-case class names used by NativeWind', () => {
    const colors = loadTailwindColors();
    expect(colors['text-muted']).toBe(themes.light.textMuted);
    expect(colors['on-primary']).toBe(themes.light.onPrimary);
    expect(colors['primary-subtle']).toBe(themes.light.primarySubtle);
    expect(colors.dark['text-muted']).toBe(themes.dark.textMuted);
    expect(colors.dark['on-primary']).toBe(themes.dark.onPrimary);
    expect(colors.dark['primary-subtle']).toBe(themes.dark.primarySubtle);
  });
});
