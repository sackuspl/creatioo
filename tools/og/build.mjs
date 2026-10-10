// Builds the social preview images and the matching head tags for creatioo.pl.
// Usage: node build.mjs [--images] [--meta] [--lang pl|en|all] [--theme light|dark] [--page home]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const config = JSON.parse(fs.readFileSync(path.join(here, 'config.json'), 'utf8'));
const args = process.argv.slice(2);
const flag = name => args.includes(`--${name}`);
const option = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 && args[i + 1] ? args[i + 1] : fallback; };

const onlyPage = option('page', '');
const theme = option('theme', config.theme || 'light');
const langOption = option('lang', 'all');
const languages = langOption === 'all' ? ['pl', 'en'] : [langOption];
const doImages = flag('images') || !flag('meta');
const doMeta = flag('meta') || !flag('images');
const outDir = path.join(root, 'assets', 'images', 'og');
const pageKeys = Object.keys(config.pages).filter(key => !onlyPage || key === onlyPage);

const esc = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const imageName = (key, lang) => `og-${key}${lang === 'en' ? '-en' : ''}.png`;
const imageUrl = (key, lang) => `${config.site}/assets/images/og/${imageName(key, lang)}?v=${config.imageVersion}`;
const pageUrl = (page, lang) => `${config.site}/${lang === 'en' && page.layout !== 'error' ? 'en/' : ''}${page.path}`;

function visualFor(page) {
  const img = name => `../../assets/images/featured/${name}`;
  if (page.layout === 'home') return `<div class="visual"><img class="hero-img" src="${img(page.image)}" alt=""></div>`;
  if (page.layout === 'gallery') return `<div class="visual gallery">${page.images.map(name => `<img src="${img(name)}" alt="">`).join('')}</div>`;
  if (page.layout === 'document') return '<div class="visual document"><img src="../../assets/images/creatioo-icon.png" alt=""></div>';
  return '<div class="visual document error"><span class="number">404</span></div>';
}

function htmlFor(page, text, lang) {
  const headline = text.headline.map((line, i) => `<span${i === text.accentLine ? ' class="accent"' : ''}>${esc(line)}</span>`).join('');
  const template = fs.readFileSync(path.join(here, 'template.html'), 'utf8');
  const values = {
    LANG: lang, THEME: theme, LABEL: esc(text.label), HEADLINE: headline, SUBTITLE: esc(text.subtitle),
    FOOTER: esc(text.footer), LAYOUT: page.layout, VISUAL: visualFor(page), LOGO: theme === 'dark' ? 'logo2.png' : 'logo.png',
    DOMAIN_SUFFIX: page.path && page.layout !== 'error' ? `/${page.path.replace(/\/$/, '')}` : ''
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? '');
}

async function renderImages() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  for (const key of pageKeys) {
    for (const lang of languages) {
      const definition = config.pages[key];
      const file = path.join(here, `.render-${key}-${lang}.html`);
      fs.writeFileSync(file, htmlFor(definition, definition[lang], lang));
      await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
      const target = path.join(outDir, imageName(key, lang));
      await page.screenshot({ path: target, type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
      fs.rmSync(file, { force: true });
      console.log(`image ${path.relative(root, target)} ${(fs.statSync(target).size / 1024).toFixed(0)} KB`);
    }
  }
  await browser.close();
}

function socialBlock(page, key, lang, text, alternate) {
  const locale = lang === 'en' ? 'en_US' : 'pl_PL';
  const other = lang === 'en' ? 'pl_PL' : 'en_US';
  const lines = [
    '<!-- og:start -->',
    `<meta property="og:site_name" content="${esc(config.brand)}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:locale" content="${locale}">`,
    `<meta property="og:locale:alternate" content="${other}">`,
    `<meta property="og:url" content="${pageUrl(page, lang)}">`,
    `<meta property="og:title" content="${esc(text.ogTitle)}"${alternate ? ` data-en="${esc(alternate.ogTitle)}"` : ''}>`,
    `<meta property="og:description" content="${esc(text.description)}"${alternate ? ` data-en="${esc(alternate.description)}"` : ''}>`,
    `<meta property="og:image" content="${imageUrl(key, lang)}">`,
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(text.alt)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(text.ogTitle)}">`,
    `<meta name="twitter:description" content="${esc(text.description)}">`,
    `<meta name="twitter:image" content="${imageUrl(key, lang)}">`,
    `<meta name="twitter:image:alt" content="${esc(text.alt)}">`,
    '<!-- og:end -->'
  ];
  return lines.join('\n');
}

function updateHead(key) {
  const page = config.pages[key];
  const file = path.join(root, page.file);
  let html = fs.readFileSync(file, 'utf8');
  const pl = page.pl, en = page.en;
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/, `<title data-en="${esc(en.title)}">${esc(pl.title)}</title>`);
  html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(pl.description)}" data-en="${esc(en.description)}">`);
  html = html.replace(/<!-- og:start -->[\s\S]*?<!-- og:end -->\n?/, '');
  html = html.replace(/[ \t]*<meta (?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\n?/g, '');
  const block = socialBlock(page, key, 'pl', pl, en);
  if (/<link rel="canonical"[^>]*>/.test(html)) html = html.replace(/(<link rel="canonical"[^>]*>)\n*/, `$1\n${block}\n`);
  else html = html.replace(/(<meta name="description"[^>]*>)\n*/, `$1\n${block}\n`);
  fs.writeFileSync(file, html);
  console.log(`head ${page.file}`);
}

// Small pages under /en/ so English links get an English preview, then send visitors to the real page.
function writeEnglishEntries() {
  for (const key of pageKeys) {
    const page = config.pages[key];
    if (page.layout === 'error') continue;
    const depth = page.path ? page.path.split('/').filter(Boolean).length + 1 : 1;
    const up = '../'.repeat(depth);
    const target = `${up}${page.path}?lang=en`;
    const text = page.en;
    const dir = path.join(root, 'en', page.path);
    fs.mkdirSync(dir, { recursive: true });
    const body = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(text.title)}</title>
<meta name="description" content="${esc(text.description)}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${pageUrl(page, 'en')}">
<meta http-equiv="refresh" content="0;url=${target}">
${socialBlock(page, key, 'en', text, null)}
<link rel="icon" type="image/png" href="${up}assets/images/creatioo-icon.png">
<script>try{localStorage.setItem('language','en')}catch(e){}location.replace(${JSON.stringify(target)})</script>
</head>
<body>
<p><a href="${target}">${esc(text.title)}</a></p>
</body>
</html>
`;
    fs.writeFileSync(path.join(dir, 'index.html'), body);
    console.log(`entry en/${page.path}index.html`);
  }
}

if (doImages) await renderImages();
if (doMeta) { pageKeys.forEach(updateHead); writeEnglishEntries(); }
