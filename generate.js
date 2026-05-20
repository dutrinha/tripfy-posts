#!/usr/bin/env node
// ============================================================
//  Tripfy Carousel Generator — Main Entry Point
// ============================================================
//  Usage:
//    node generate.js --input example.json --code 4F7X92
//    node generate.js --input example.json --code 4F7X92 --city Paris
// ============================================================

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parseItinerary, extractCity } from './src/parser.js';
import { fetchImagesForDay } from './src/imageFetcher.js';
import { renderDaySlide } from './src/slideRenderer.js';
import { renderCtaSlide } from './src/ctaRenderer.js';
import { renderHookSlide } from './src/hookRenderer.js';
import { generateCaption } from './src/captionGenerator.js';
import { CONFIG } from './config.js';

// Font Registration for Vercel/Linux environments
import { GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const regularFont = path.join(__dirname, 'assets', 'Inter-Regular.ttf');
  const boldFont = path.join(__dirname, 'assets', 'Inter-Bold.ttf');

  if (fs.existsSync(regularFont)) {
    GlobalFonts.registerFromPath(regularFont, 'Arial');
  }
  if (fs.existsSync(boldFont)) {
    GlobalFonts.registerFromPath(boldFont, 'Arial');
  }
} catch (e) {
  console.warn('⚠️ Warning: Failed to register custom fonts:', e.message);
}

// ── CLI Argument Parsing ───────────────────────────────────

function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
}

// ── Main Pipeline ──────────────────────────────────────────

export async function generateCarousel(raw, code, cityArg) {
  console.log();
  console.log('  \x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('  \x1b[1m  Tripfy Carousel Generator\x1b[0m');
  console.log('  \x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log();

  // ── 1. Load & Parse JSON ──
  console.log('  \x1b[36m[1/5]\x1b[0m Parsing itinerary...');

  const itinerary = parseItinerary(raw);
  const city = cityArg || extractCity(itinerary);
  const totalSlides = itinerary.length + 2; // hook + days + CTA

  console.log(`       ${itinerary.length} day(s) detected · City: ${city}`);
  console.log(`       Code: ${code} · Output: ${totalSlides} slides`);
  console.log();

  // ── 2. Ensure output directory (only if writable) ──
  const outDir = CONFIG.output.directory;
  let isWritable = true;
  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  } catch (e) {
    isWritable = false;
    console.warn('⚠️ Warning: Output directory is not writable (running in serverless environment). Image generation will return Base64 instead.');
  }

  const generatedFiles = [];

  // ── 3. Render Hook Slide ──
  console.log('  \x1b[36m[2/5]\x1b[0m Rendering hook slide...');
  const hookBuffer = await renderHookSlide(city, itinerary.length, itinerary, 'itinerary');
  const hookFilename = `slide_00_hook.png`;
  const hookPath = path.join(outDir, hookFilename);
  
  if (isWritable) {
    try {
      fs.writeFileSync(hookPath, hookBuffer);
      console.log(`       \x1b[32m→\x1b[0m Saved: ${hookFilename} (${(hookBuffer.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.warn('⚠️ Could not write hook slide to disk:', e.message);
    }
  }

  generatedFiles.push({
    name: hookFilename,
    base64: hookBuffer.toString('base64'),
    path: hookPath
  });
  console.log();

  // ── 4. Fetch Images & Render Day Slides ──
  console.log('  \x1b[36m[3/5]\x1b[0m Fetching images & rendering slides...');
  console.log();

  for (const day of itinerary) {
    console.log(`  \x1b[33mDay ${day.day}\x1b[0m — ${day.activities.length} activities`);

    // Fetch images for ALL activities (one photo per location)
    const imageBuffers = await fetchImagesForDay(
      day.activities,
      city,
      day.day,
      day.activities.length
    );

    // Render the slide
    const slideIndex = day.day;
    const pngBuffer = await renderDaySlide(day, imageBuffers, city, slideIndex, totalSlides);

    // Save
    const filename = `slide_${String(day.day).padStart(2, '0')}_day${day.day}.png`;
    const filepath = path.join(outDir, filename);
    
    if (isWritable) {
      try {
        fs.writeFileSync(filepath, pngBuffer);
        console.log(`       \x1b[32m→\x1b[0m Saved: ${filename} (${(pngBuffer.length / 1024).toFixed(0)} KB)`);
      } catch (e) {
        console.warn(`⚠️ Could not write ${filename} to disk:`, e.message);
      }
    }

    generatedFiles.push({
      name: filename,
      base64: pngBuffer.toString('base64'),
      path: filepath
    });
    console.log();
  }

  // ── 5. Render CTA Slide ──
  console.log('  \x1b[36m[4/5]\x1b[0m Rendering CTA slide...');

  const ctaIndex = itinerary.length + 1;
  const ctaBuffer = await renderCtaSlide(code, city, ctaIndex, totalSlides, 'itinerary');

  const ctaFilename = `slide_${String(ctaIndex).padStart(2, '0')}_cta.png`;
  const ctaFilepath = path.join(outDir, ctaFilename);
  
  if (isWritable) {
    try {
      fs.writeFileSync(ctaFilepath, ctaBuffer);
      console.log(`       \x1b[32m→\x1b[0m Saved: ${ctaFilename} (${(ctaBuffer.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.warn('⚠️ Could not write CTA slide to disk:', e.message);
    }
  }

  generatedFiles.push({
    name: ctaFilename,
    base64: ctaBuffer.toString('base64'),
    path: ctaFilepath
  });
  console.log();

  // ── 6. Generate Caption ──
  console.log('  \x1b[36m[5/5]\x1b[0m Generating viral caption...');

  const caption = generateCaption(city, itinerary.length, code, itinerary, 'itinerary');
  const captionPath = path.join(outDir, 'caption.txt');
  
  if (isWritable) {
    try {
      fs.writeFileSync(captionPath, caption, 'utf-8');
      console.log(`       \x1b[32m→\x1b[0m Saved: caption.txt`);
    } catch (e) {
      console.warn('⚠️ Could not write caption to disk:', e.message);
    }
  }
  console.log();

  // ── Done ──
  console.log('  \x1b[36m[5/5]\x1b[0m Complete!');
  console.log();
  console.log('  \x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log(`  \x1b[1m  ${generatedFiles.length} slides generated\x1b[0m`);
  if (isWritable) {
    console.log(`  \x1b[2m  Output: ${path.resolve(outDir)}\x1b[0m`);
  }
  console.log('  \x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log();

  // Print caption preview
  console.log('  \x1b[33m── Caption Preview ──\x1b[0m');
  console.log();
  const lines = caption.split('\n').slice(0, 8);
  lines.forEach((l) => console.log(`  ${l}`));
  console.log('  ...');
  console.log();
  
  return { generatedFiles, caption };
}

// ── CLI Execution ──
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const inputFile = getArg('input') || 'example.json';
  const code      = getArg('code')  || '000000';
  const cityArg   = getArg('city');

  if (!fs.existsSync(inputFile)) {
    console.error(`\n  \x1b[31mError:\x1b[0m File not found: ${inputFile}`);
    console.error('  Usage: node generate.js --input <file.json> --code <CODE>\n');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  generateCarousel(raw, code, cityArg).catch((err) => {
    console.error('\n  \x1b[31mFatal error:\x1b[0m', err.message);
    console.error(err.stack);
    process.exit(1);
  });
}
