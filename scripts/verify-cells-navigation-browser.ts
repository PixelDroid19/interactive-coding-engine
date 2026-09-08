import { existsSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { createOpenCellsLessonWorkspace } from '../src/curriculum/open-cells/lessonWorkspaces';
import { buildCellsPreviewDocument } from '../src/engine/cells/cellsPreviewCompiler';

const browser = await chromium.launch({ executablePath: existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined, headless: true });
try {
  const page = await browser.newPage();
  const exportedUrl = process.env.CELLS_NAVIGATION_APP_URL;
  if (exportedUrl) {
    await page.goto(exportedUrl);
  } else {
    await page.setContent('<iframe title="Aplicación" sandbox="allow-scripts" style="width:100%;height:900px"></iframe>');
    const html = buildCellsPreviewDocument(createOpenCellsLessonWorkspace(75).snapshot).html;
    await page.locator('iframe').evaluate((frame: HTMLIFrameElement, content) => { frame.srcdoc = content; }, html);
  }
  const app = exportedUrl ? page : page.frameLocator('iframe');
  await app.locator('academy-home-page').waitFor();
  const draft = app.getByLabel('Notas del proyecto', { exact: true });
  await draft.fill('Conservar este borrador');
  await app.getByRole('button', { name: 'Favoritos', exact: true }).click();
  await expect(app.getByRole('dialog')).toBeVisible();
  await app.getByRole('button', { name: 'Seguir editando', exact: true }).click();
  await expect(app.locator('academy-home-page')).toBeVisible();
  await expect(draft).toHaveValue('Conservar este borrador');
  await app.getByRole('button', { name: 'Favoritos', exact: true }).click();
  await app.getByRole('button', { name: 'Descartar y salir', exact: true }).click();
  await expect(app.locator('academy-favorites-page')).toBeVisible();
  await expect(draft).toHaveValue('');
  await expect(app.getByRole('dialog')).not.toBeVisible();
  await draft.fill('Nota guardada');
  await app.getByRole('button', { name: 'Guardar notas', exact: true }).click();
  await expect(app.getByText('Notas guardadas', { exact: true })).toBeVisible();
  const frame = exportedUrl ? page.mainFrame() : page.frames()[1];
  await frame.evaluate(`document.querySelector('academy-favorites-page').navigate('home')`);
  await expect(app.locator('academy-home-page')).toBeVisible();
  await expect(app.getByRole('dialog')).not.toBeVisible();
  await expect(draft).toHaveValue('Nota guardada');
  await frame.evaluate(`document.querySelector('academy-home-page').setLanguage('en')`);
  await expect(app.getByLabel('Project notes', { exact: true })).toBeVisible();
  await frame.evaluate(`document.querySelector('academy-home-page').setLanguage('es')`);
  await draft.fill('Cambio posterior');
  await app.getByRole('button', { name: 'Favoritos', exact: true }).click();
  await expect(app.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: '/tmp/cells-navigation-75-desktop.png' });
  await page.keyboard.press('Escape');
  await expect(app.getByRole('dialog')).not.toBeVisible();
  await expect(app.getByRole('button', { name: 'Favoritos', exact: true })).toBeFocused();
  await expect(draft).toHaveValue('Cambio posterior');
  await page.setViewportSize({ width: 390, height: 844 });
  await app.getByRole('button', { name: 'Favoritos', exact: true }).click();
  await expect(app.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: '/tmp/cells-navigation-75-mobile.png' });
  await frame.evaluate(`document.querySelector('academy-home-page').navigate('search')`);
  await app.getByRole('button', { name: 'Descartar y salir', exact: true }).click();
  await expect(app.locator('academy-search-page')).toBeVisible();
  await expect(draft).toHaveValue('Nota guardada');
  console.log(JSON.stringify({ lesson: 75, runtime: exportedUrl ? 'exported-open-cells' : 'playground', cancellationPreservesDraft: true, acceptanceDiscardsDraft: true, savedDraft: true, escapeRestoresFocus: true, languageSwitch: true, mobile: true, latestNavigationWins: true }));
} finally {
  await browser.close();
}
