const fs = require('fs');
const path = require('path');
const { decode, encode } = require('fast-png');

const inputPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\aed9fc34-626a-43f3-a041-3bbdedcb5ce0\\.user_uploaded\\media_1791289702958.png';
const outDir = path.resolve(__dirname, '../src/assets/icons');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Copy source strip
fs.copyFileSync(inputPath, path.join(outDir, 'crop_stages_strip.png'));
console.log('Saved original strip to crop_stages_strip.png');

const raw = fs.readFileSync(inputPath);
const img = decode(raw);

const stageConfigs = [
  { name: 'stage_1_seedling', key: 'seedling', label: 'Seedling' },
  { name: 'stage_2_transplanting', key: 'transplanting', label: 'Transplanting' },
  { name: 'stage_3_vine_growth', key: 'vine_growth', label: 'Vine Growth' },
  { name: 'stage_4_flowering', key: 'flowering', label: 'Flowering' },
  { name: 'stage_5_pollination', key: 'pollination', label: 'Pollination' },
  { name: 'stage_6_fertilizing', key: 'fertilizing', label: 'Fertilizing' },
  { name: 'stage_7_pest_check', key: 'pest_check', label: 'Pest Check' },
  { name: 'stage_8_harvest', key: 'harvest', label: 'Harvest' },
];

// Determine boundaries for each icon by column activity
const colActive = [];
for (let x = 0; x < img.width; x++) {
  let hasAlpha = false;
  for (let y = 0; y < img.height; y++) {
    const idx = (y * img.width + x) * 4;
    if (img.data[idx + 3] > 15) {
      hasAlpha = true;
      break;
    }
  }
  colActive.push(hasAlpha);
}

const regions = [];
let inRegion = false;
let start = 0;
for (let x = 0; x < img.width; x++) {
  if (colActive[x] && !inRegion) {
    inRegion = true;
    start = x;
  } else if (!colActive[x] && inRegion) {
    inRegion = false;
    regions.push({ start, end: x - 1 });
  }
}
if (inRegion) {
  regions.push({ start, end: img.width - 1 });
}

if (regions.length !== 8) {
  console.error(`Expected 8 regions, found ${regions.length}`);
  process.exit(1);
}

const dataUrls = {};

regions.forEach((r, idx) => {
  const cfg = stageConfigs[idx];

  // Find exact vertical bounding box
  let minY = img.height;
  let maxY = 0;
  for (let x = r.start; x <= r.end; x++) {
    for (let y = 0; y < img.height; y++) {
      const pIdx = (y * img.width + x) * 4;
      if (img.data[pIdx + 3] > 15) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 2;
  const cropX0 = Math.max(0, r.start - pad);
  const cropX1 = Math.min(img.width - 1, r.end + pad);
  const cropY0 = Math.max(0, minY - pad);
  const cropY1 = Math.min(img.height - 1, maxY + pad);

  const cropW = cropX1 - cropX0 + 1;
  const cropH = cropY1 - cropY0 + 1;

  const croppedData = new Uint8Array(cropW * cropH * 4);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcX = cropX0 + x;
      const srcY = cropY0 + y;
      const srcIdx = (srcY * img.width + srcX) * 4;
      const dstIdx = (y * cropW + x) * 4;

      croppedData[dstIdx] = img.data[srcIdx];
      croppedData[dstIdx + 1] = img.data[srcIdx + 1];
      croppedData[dstIdx + 2] = img.data[srcIdx + 2];
      croppedData[dstIdx + 3] = img.data[srcIdx + 3];
    }
  }

  const pngBuf = Buffer.from(encode({
    width: cropW,
    height: cropH,
    data: croppedData,
    channels: 4,
    depth: 8
  }));

  const outFilePath = path.join(outDir, `${cfg.name}.png`);
  fs.writeFileSync(outFilePath, pngBuf);
  console.log(`Saved ${cfg.name}.png (${cropW}x${cropH})`);

  const b64 = pngBuf.toString('base64');
  dataUrls[cfg.key] = `data:image/png;base64,${b64}`;
});

// Write data URLs mapping file for direct component embedding
fs.writeFileSync(
  path.join(outDir, 'cropStageIconsData.json'),
  JSON.stringify(dataUrls, null, 2)
);
console.log('Saved cropStageIconsData.json successfully.');
