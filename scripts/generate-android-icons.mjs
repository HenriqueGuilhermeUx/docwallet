import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const androidResDir = path.join(root, 'android', 'app', 'src', 'main', 'res');
const sourceIcon = path.join(root, 'play-store', 'assets', 'docwallet-icon-512.svg');

const densities = [
  { dir: 'mipmap-mdpi', launcher: 48, foreground: 108 },
  { dir: 'mipmap-hdpi', launcher: 72, foreground: 162 },
  { dir: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
  { dir: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
  { dir: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
];

await fs.access(sourceIcon);
await fs.mkdir(androidResDir, { recursive: true });

for (const density of densities) {
  const targetDir = path.join(androidResDir, density.dir);
  await fs.mkdir(targetDir, { recursive: true });

  await sharp(sourceIcon)
    .resize(density.launcher, density.launcher)
    .png({ compressionLevel: 9 })
    .toFile(path.join(targetDir, 'ic_launcher.png'));

  await sharp(sourceIcon)
    .resize(density.launcher, density.launcher)
    .png({ compressionLevel: 9 })
    .toFile(path.join(targetDir, 'ic_launcher_round.png'));

  await sharp(sourceIcon)
    .resize(density.foreground, density.foreground)
    .png({ compressionLevel: 9 })
    .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));
}

const anydpiDir = path.join(androidResDir, 'mipmap-anydpi-v26');
const valuesDir = path.join(androidResDir, 'values');
await fs.mkdir(anydpiDir, { recursive: true });
await fs.mkdir(valuesDir, { recursive: true });

const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;

await fs.writeFile(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveIconXml, 'utf8');
await fs.writeFile(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveIconXml, 'utf8');
await fs.writeFile(
  path.join(valuesDir, 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0F172A</color>
</resources>
`,
  'utf8',
);

console.log('DocWallet Android launcher icons generated from play-store/assets/docwallet-icon-512.svg');
