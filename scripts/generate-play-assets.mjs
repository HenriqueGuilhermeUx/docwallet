import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const inputDir = path.join(root, 'play-store', 'assets');
const outputDir = path.join(root, 'play-store', 'output');

await fs.mkdir(outputDir, { recursive: true });

const iconSvg = path.join(inputDir, 'docwallet-icon-512.svg');
const featureSvg = path.join(inputDir, 'docwallet-feature-graphic-1024x500.svg');

await sharp(iconSvg)
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(path.join(outputDir, 'docwallet-icon-512.png'));

await sharp(featureSvg)
  .resize(1024, 500)
  .png({ compressionLevel: 9 })
  .toFile(path.join(outputDir, 'docwallet-feature-graphic-1024x500.png'));

await sharp(featureSvg)
  .resize(1024, 500)
  .jpeg({ quality: 92 })
  .toFile(path.join(outputDir, 'docwallet-feature-graphic-1024x500.jpg'));

console.log('Play Store assets generated in play-store/output');
