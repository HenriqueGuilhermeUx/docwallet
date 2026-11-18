// CI-only image inspection: detect suspicious uniform screens in iOS simulator captures.
// Source build already includes sharp. No images or data leave GitHub Actions.
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const paths = process.argv.slice(2);
if (!paths.length) throw new Error('Usage: node check-ios-smoke-screenshots.mjs <png> [...]');
let flagged = false;
for (const path of paths) {
  if (!existsSync(path)) {
    console.log(`SCREENSHOT_MISSING ${path}`);
    flagged = true;
    continue;
  }
  const image = sharp(path);
  const meta = await image.metadata();
  const stats = await image.stats();
  const rgb = stats.channels.slice(0, 3);
  const variation = rgb.reduce((sum, ch) => sum + ch.stdev, 0) / Math.max(1, rgb.length);
  // Diagnostic threshold, not an accessibility or functional acceptance test.
  const uniform = variation < 4;
  console.log(`SCREENSHOT_CHECK ${path} ${meta.width}x${meta.height} ${meta.format} rgb_stdev=${variation.toFixed(2)} ${uniform ? 'SUSPICIOUS_UNIFORM' : 'NON_UNIFORM'}`);
  if (uniform) flagged = true;
}
if (flagged) {
  console.log('::warning::An iOS screenshot is missing or nearly uniform. Review actual simulator images; no functional QA can be inferred.');
}
console.log('PASS: screenshot diagnostics reported; only simulator launch/appearance were inspected.');
