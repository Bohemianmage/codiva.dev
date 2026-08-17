import { existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = join(root, 'public/client-packs/nirc/propuesta-licencia.html');
const pdfPath = join(root, 'public/client-packs/nirc/Codiva-NIRC-propuesta-licencia.pdf');

const chromeCandidates = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

const executablePath = chromeCandidates.find((p) => existsSync(p));
if (!executablePath) {
  console.error('No se encontró Chrome/Edge para generar el PDF.');
  process.exit(1);
}
if (!existsSync(htmlPath)) {
  console.error('Falta el HTML:', htmlPath);
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
});

try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load', timeout: 45_000 });
  await page.emulateMediaType('print');
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '10mm', right: '11mm', bottom: '12mm', left: '11mm' },
  });
  writeFileSync(pdfPath, pdf);
  console.log('PDF listo:', pdfPath);
} finally {
  await browser.close().catch(() => undefined);
}
