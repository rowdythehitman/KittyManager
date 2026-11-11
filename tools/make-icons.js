// Regenerates icons/icon-192.png and icons/icon-512.png from the cat sprites.
// Usage: node tools/make-icons.js   (needs Playwright)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const sprites = fs.readFileSync(path.join(root, 'sprites.js'), 'utf8');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const size of [192, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<body style="margin:0"><canvas id="c" width="${size}" height="${size}"></canvas>
      <script>${sprites}
        const ctx = document.getElementById('c').getContext('2d');
        ctx.fillStyle = '#ddd3c9';
        ctx.fillRect(0, 0, ${size}, ${size});
        const s = ${size} / 32;                       // 20x16 sprite inside the maskable safe zone
        drawSprite(ctx, SPRITES.sit, PALETTES.diego, 6 * s, 8 * s, s);
      </script>`);
    await page.locator('#c').screenshot({ path: path.join(root, 'icons', `icon-${size}.png`) });
  }
  await browser.close();
})();
