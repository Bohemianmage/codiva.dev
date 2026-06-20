/**
 * Generates public/og-image.png (1200×630) for Open Graph / Twitter cards.
 * Run: npm run generate-og-image
 */
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import brand from '../lib/brand.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const logoPath = join(publicDir, 'logo.svg');

const { primary, background } = brand.colors;
const tagline = brand.taglineShort;

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${background}"/>
      <stop offset="100%" stop-color="#EEF2F2"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="980" cy="120" r="180" fill="${primary}" opacity="0.06"/>
  <circle cx="1100" cy="520" r="240" fill="${primary}" opacity="0.04"/>
  <text x="600" y="300" text-anchor="middle" font-family="system-ui,Segoe UI,sans-serif" font-size="64" font-weight="700" fill="#18181B">Codiva<tspan fill="${primary}">.dev</tspan></text>
  <text x="600" y="370" text-anchor="middle" font-family="system-ui,Segoe UI,sans-serif" font-size="26" fill="${primary}">${tagline}</text>
  <rect x="420" y="410" width="360" height="4" rx="2" fill="${primary}" opacity="0.35"/>
</svg>`;

const logoBuf = await readFile(logoPath);
const logoPng = await sharp(logoBuf).resize(88, 88).png().toBuffer();

await writeFile(
  join(publicDir, 'og-image.png'),
  await sharp(Buffer.from(svg))
    .composite([{ input: logoPng, top: 130, left: 556 }])
    .png()
    .toBuffer()
);

console.log('OK: public/og-image.png');
