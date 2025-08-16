#!/usr/bin/env node
/**
 * Optimize raster images in src/img (PNG/JPG/JPEG) to WebP & AVIF + responsive sizes.
 * Usage: npm run optimize-images
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = path.join(__dirname, '..', 'src', 'img');
const OUT_DIR = SRC_DIR; // in-place (adds .webp/.avif variants & size suffixes)
const RESPONSIVE_WIDTHS = [480, 768, 1080];

function isRaster(f){ return /(\.jpe?g|\.png)$/i.test(f); }

async function processFile(file){
  const inPath = path.join(SRC_DIR, file);
  const stat = await fs.promises.stat(inPath);
  if(stat.size < 50 * 1024){ // skip very small files
    console.log('Skip small', file);
    return;
  }
  const base = file.replace(/\.[^.]+$/, '');
  const input = sharp(inPath).rotate();
  const metadata = await input.metadata();
  const targetWidths = RESPONSIVE_WIDTHS.filter(w => w < (metadata.width || w*2));
  // Original-size webp/avif
  await Promise.all([
    input.clone().webp({ quality: 78 }).toFile(path.join(OUT_DIR, base + '.webp')),
    input.clone().avif({ quality: 60 }).toFile(path.join(OUT_DIR, base + '.avif'))
  ]);
  // Responsive variants
  await Promise.all(targetWidths.flatMap(w => [
    input.clone().resize({ width: w }).webp({ quality: 74 }).toFile(path.join(OUT_DIR, `${base}-${w}.webp`)),
    input.clone().resize({ width: w }).avif({ quality: 56 }).toFile(path.join(OUT_DIR, `${base}-${w}.avif`))
  ]));
  console.log('Optimized', file, '-> variants:', ['webp','avif', ...targetWidths.flatMap(w=>[`webp@${w}`,`avif@${w}`])].join(','));
}

async function run(){
  const files = await fs.promises.readdir(SRC_DIR);
  const rasters = files.filter(isRaster);
  for(const f of rasters){
    try{ await processFile(f); } catch(e){ console.error('Failed', f, e.message); }
  }
  console.log('Done. Update components to use <picture> with webp/avif fallbacks.');
}
run();
