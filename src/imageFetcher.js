// ============================================================
// Image Fetcher — Pexels / Unsplash with disk cache
// ============================================================

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CONFIG } from '../config.js';

const CACHE_DIR = CONFIG.images.cacheDir;

// ── Cache helpers ──────────────────────────────────────────

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (e) {
    // Silent fail on read-only environments like Vercel
  }
}

function cacheKey(query) {
  return crypto.createHash('md5').update(query.toLowerCase().trim()).digest('hex');
}

function cachePath(query) {
  return path.join(CACHE_DIR, `${cacheKey(query)}.jpg`);
}

function readCache(query) {
  try {
    const p = cachePath(query);
    return fs.existsSync(p) ? fs.readFileSync(p) : null;
  } catch (e) {
    return null;
  }
}

function writeCache(query, buffer) {
  try {
    ensureCacheDir();
    fs.writeFileSync(cachePath(query), buffer);
  } catch (e) {
    // Silent fail on read-only environments like Vercel
  }
}

// ── API Fetchers ───────────────────────────────────────────

async function pexels(query, orientation = 'portrait') {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;

  try {
    const { data } = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: key },
      params: { query, per_page: 1, orientation },
      timeout: CONFIG.images.timeout,
    });

    const photo = data.photos?.[0];
    if (!photo) return null;

    const url = photo.src.large2x || photo.src.large;
    const img = await axios.get(url, { responseType: 'arraybuffer', timeout: CONFIG.images.timeout });
    return Buffer.from(img.data);
  } catch (err) {
    console.warn(`    [pexels] failed for "${query}": ${err.message}`);
    return null;
  }
}

async function pexelsMultiple(query, count = 4, orientation = 'portrait') {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];

  try {
    const { data } = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: key },
      params: { query, per_page: count, orientation },
      timeout: CONFIG.images.timeout,
    });

    if (!data.photos || data.photos.length === 0) return [];

    const buffers = [];
    for (const photo of data.photos) {
      const url = photo.src.large2x || photo.src.large;
      try {
        const img = await axios.get(url, { responseType: 'arraybuffer', timeout: CONFIG.images.timeout });
        buffers.push(Buffer.from(img.data));
      } catch (e) {
        console.warn(`    [pexelsMultiple] failed to fetch image url: ${url}`);
      }
    }
    return buffers;
  } catch (err) {
    console.warn(`    [pexelsMultiple] failed for "${query}": ${err.message}`);
    return [];
  }
}


// ── Local Image Loader ─────────────────────────────────────
// Place images in ./images/ named by place_id or day-index
// e.g.  images/I93C4DAE17C80105A.jpg   or   images/day1-0.jpg

function loadLocalImage(activityId, dayNum, index) {
  const imagesDir = './images';
  if (!fs.existsSync(imagesDir)) return null;

  const candidates = [
    path.join(imagesDir, `${activityId}.jpg`),
    path.join(imagesDir, `${activityId}.png`),
    path.join(imagesDir, `day${dayNum}-${index}.jpg`),
    path.join(imagesDir, `day${dayNum}-${index}.png`),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p);
  }
  return null;
}



// ── Main Fetch Function ────────────────────────────────────

/**
 * Fetch background image for the hook slide.
 * Always queries Pexels with the query: "(CITY) famous places pov".
 * Checks disk cache first to prevent hitting API limits.
 */
export async function fetchHookImage(city) {
  const cityLower = city ? city.toLowerCase().trim() : '';
  let query = '';

  const override = CONFIG.hook?.citySpecificQueries?.[cityLower];
  if (override) {
    query = override;
  } else {
    const template = CONFIG.hook?.hookFetchingText || '(CITY) street aesthetic vlog';
    query = template.replace(/\(CITY\)/gi, city);
  }

  // 1. Disk cache
  const cached = readCache(query);
  if (cached) {
    process.stdout.write(`    \x1b[32m✓\x1b[0m cached  ${query}\n`);
    return cached;
  }

  // 2. Pexels (full query)
  let buf = await pexels(query);
  if (buf) {
    process.stdout.write(`    \x1b[35m✓\x1b[0m pexels  ${query}\n`);
    writeCache(query, buf);
    return buf;
  }

  // 3. Fallback standard fetching if Pexels fails
  process.stdout.write(`    \x1b[31m✗\x1b[0m pexels failed for hook, trying fallback  ${query}\n`);
  return fetchImageForLocation(query, city);
}

/**
 * Fetch a high-quality image for a location.
 * Priority: cache → local → Pexels → Unsplash → Wikipedia → city fallback → null
 */
export async function fetchImageForLocation(locationName, city, activityId = '', dayNum = 1, index = 0) {
  const fullQuery = `${locationName} ${city}`;

  // 1. Disk cache
  const cached = readCache(fullQuery);
  if (cached) {
    process.stdout.write(`    \x1b[32m✓\x1b[0m cached  ${locationName}\n`);
    return cached;
  }

  // 2. Local image override
  const local = loadLocalImage(activityId, dayNum, index);
  if (local) {
    process.stdout.write(`    \x1b[34m✓\x1b[0m local   ${locationName}\n`);
    writeCache(fullQuery, local);
    return local;
  }

  // 3. Pexels (full query)
  let buf = await pexels(fullQuery);
  if (buf) { process.stdout.write(`    \x1b[35m✓\x1b[0m pexels  ${locationName}\n`); writeCache(fullQuery, buf); return buf; }


  // 5. Pexels (name only)
  buf = await pexels(locationName);
  if (buf) { process.stdout.write(`    \x1b[35m~\x1b[0m pexels  ${locationName} (name-only)\n`); writeCache(fullQuery, buf); return buf; }




  // 8. City fallback (wiki)
  const fallbackTemplate = CONFIG.images?.cityFallbackQuery || '{city} landmark';
  const cityQuery = fallbackTemplate.replace(/\{city\}/gi, city);
  const cityBuf = readCache(cityQuery) || await pexels(cityQuery);
  if (cityBuf) {
    process.stdout.write(`    \x1b[33m~\x1b[0m city fb ${locationName}\n`);
    writeCache(cityQuery, cityBuf);
    return cityBuf;
  }

  // 9. No image found — renderer will use gradient placeholder
  process.stdout.write(`    \x1b[31m✗\x1b[0m none    ${locationName}\n`);
  return null;
}

/**
 * Fetch images for all locations in a day (up to maxPhotos).
 */
export async function fetchImagesForDay(activities, city, dayNum, maxPhotos = 4) {
  const selected = activities.slice(0, maxPhotos);
  const buffers = [];

  for (let i = 0; i < selected.length; i++) {
    const a = selected[i];
    const buf = await fetchImageForLocation(a.name, city, a.id, dayNum, i);
    buffers.push(buf);
  }

  return buffers;
}

/**
 * Fetch multiple images for a single location (used for Top Places 2x2 grid).
 * Priority: cache → Pexels → city fallback → empty array
 */
export async function fetchMultipleImagesForLocation(locationName, city, count = 4) {
  const fullQuery = `${locationName} ${city}`;
  
  // 1. Pexels (full query)
  let buffers = await pexelsMultiple(fullQuery, count);
  if (buffers.length >= count) {
    process.stdout.write(`    \x1b[35m✓\x1b[0m pexelsMultiple  ${locationName} (${buffers.length} imgs)\n`);
    return buffers.slice(0, count);
  }

  // 2. Pexels (name only)
  const fallbackBuffers = await pexelsMultiple(locationName, count);
  if (fallbackBuffers.length >= count) {
    process.stdout.write(`    \x1b[35m~\x1b[0m pexelsMultiple  ${locationName} (name-only)\n`);
    return fallbackBuffers.slice(0, count);
  }

  // 3. If we still don't have enough, try to combine or use fallback
  const combined = [...buffers, ...fallbackBuffers];
  // Deduplicate by basic size check (not perfect but better than nothing)
  const unique = [];
  const sizes = new Set();
  for (const b of combined) {
    if (!sizes.has(b.length)) {
      unique.push(b);
      sizes.add(b.length);
    }
  }

  if (unique.length > 0) {
    process.stdout.write(`    \x1b[33m~\x1b[0m combined multiple ${locationName} (${unique.length} imgs)\n`);
    return unique.slice(0, count);
  }

  process.stdout.write(`    \x1b[31m✗\x1b[0m none multiple   ${locationName}\n`);
  return [];
}
