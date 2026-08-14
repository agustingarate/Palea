import { expect, test } from '@playwright/test';

test('auth layout is responsive and exposes supported methods', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading')).toBeVisible();
  await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /LinkedIn/i })).toBeVisible();
  await expect(page.locator('body')).toHaveJSProperty(
    'scrollWidth',
    await page.locator('body').evaluate((body) => body.clientWidth),
  );
});

test('registration preserves input after client validation failure', async ({
  page,
}) => {
  await page.goto('/auth/register');
  await page.getByLabel(/Nombre completo|Full name/i).fill('Ada Lovelace');
  await page.getByLabel(/^Email$/i).fill('ada@example.com');
  await page.getByLabel(/^Contraseña$|^Password$/i).fill('weak');
  await page.getByRole('button', { name: /Registrarme|Register/i }).click();
  await expect(page.getByLabel(/^Email$/i)).toHaveValue('ada@example.com');
  await expect(page.getByRole('alert')).toBeVisible();
});
