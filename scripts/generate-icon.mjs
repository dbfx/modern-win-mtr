import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'build');
mkdirSync(outDir, { recursive: true });

// Modern MTR icon: a stylized network trace / signal wave on a dark rounded square
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="50%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#f472b6"/>
    </linearGradient>
  </defs>

  <!-- Background rounded square -->
  <rect x="16" y="16" width="480" height="480" rx="96" ry="96" fill="url(#bg)"/>
  <rect x="16" y="16" width="480" height="480" rx="96" ry="96" fill="none" stroke="url(#accent)" stroke-width="3" opacity="0.4"/>

  <!-- Network trace line (stylized MTR path) -->
  <polyline
    points="80,380 140,340 190,360 240,280 290,300 330,200 370,220 410,140 432,160"
    fill="none" stroke="url(#glow)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Hop dots -->
  <circle cx="80" cy="380" r="10" fill="#22d3ee"/>
  <circle cx="140" cy="340" r="8" fill="#34d399"/>
  <circle cx="190" cy="360" r="8" fill="#34d399"/>
  <circle cx="240" cy="280" r="8" fill="#a78bfa"/>
  <circle cx="290" cy="300" r="8" fill="#a78bfa"/>
  <circle cx="330" cy="200" r="8" fill="#f472b6"/>
  <circle cx="370" cy="220" r="8" fill="#f472b6"/>
  <circle cx="410" cy="140" r="10" fill="#fb923c"/>
  <circle cx="432" cy="160" r="12" fill="#22d3ee">
  </circle>

  <!-- Subtle pulse rings on destination -->
  <circle cx="432" cy="160" r="22" fill="none" stroke="#22d3ee" stroke-width="2" opacity="0.5"/>
  <circle cx="432" cy="160" r="34" fill="none" stroke="#22d3ee" stroke-width="1.5" opacity="0.25"/>

  <!-- MTR text -->
  <text x="256" y="460" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="72" fill="url(#glow)" letter-spacing="12">MTR</text>
</svg>`;

// Generate PNGs at multiple sizes
const sizes = [16, 32, 48, 64, 128, 256, 512];

async function generate() {
  const pngBuffers = {};

  for (const size of sizes) {
    const buf = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers[size] = buf;
    writeFileSync(join(outDir, `icon-${size}.png`), buf);
  }

  // Save the 512px as the main PNG
  writeFileSync(join(outDir, 'icon.png'), pngBuffers[512]);

  // Generate ICO from multiple sizes
  const icoSizes = [16, 32, 48, 64, 128, 256].map(s => pngBuffers[s]);
  const ico = await pngToIco(icoSizes);
  writeFileSync(join(outDir, 'icon.ico'), ico);

  console.log('Icons generated in build/');
  console.log('  icon.png (512x512)');
  console.log('  icon.ico (multi-size)');
  console.log('  icon-{16,32,48,64,128,256,512}.png');
}

generate().catch(err => { console.error(err); process.exit(1); });
