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

async function pexels(query) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;

  try {
    const { data } = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: key },
      params: { query, per_page: 1, orientation: 'landscape', size: 'large' },
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

async function unsplash(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  try {
    const { data } = await axios.get('https://api.unsplash.com/search/photos', {
      headers: { Authorization: `Client-ID ${key}` },
      params: { query, per_page: 1, orientation: 'portrait' },
      timeout: CONFIG.images.timeout,
    });

    const result = data.results?.[0];
    if (!result) return null;

    const url = result.urls.regular;
    const img = await axios.get(url, { responseType: 'arraybuffer', timeout: CONFIG.images.timeout });
    return Buffer.from(img.data);
  } catch (err) {
    console.warn(`    [unsplash] failed for "${query}": ${err.message}`);
    return null;
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

// ── Free Wikipedia / Wikimedia Image Fetcher ───────────────
// No API key required — uses the open MediaWiki API

const WIKI_UA = { 'User-Agent': 'TripfyCarouselGenerator/1.0 (https://tripfy.app; contact@tripfy.app)' };

async function wikimedia(query) {
  try {
    const apiUrl = 'https://en.wikipedia.org/w/api.php';

    // Step 1: Search Wikipedia for the page
    const { data: searchData } = await axios.get(apiUrl, {
      headers: WIKI_UA,
      params: {
        action: 'query',
        list: 'search',
        srsearch: query,
        srlimit: 1,
        format: 'json',
      },
      timeout: CONFIG.images.timeout,
    });

    const page = searchData?.query?.search?.[0];
    if (!page) return null;

    // Step 2: Get page's main image (pageimages API)
    const { data: imageData } = await axios.get(apiUrl, {
      headers: WIKI_UA,
      params: {
        action: 'query',
        titles: page.title,
        prop: 'pageimages',
        piprop: 'original',
        format: 'json',
      },
      timeout: CONFIG.images.timeout,
    });

    const pages = imageData?.query?.pages;
    if (!pages) return null;

    const pageObj = Object.values(pages)[0];
    const imageUrl = pageObj?.original?.source;
    if (!imageUrl) return null;

    // Skip SVGs / icons — only want actual photos
    if (/\.svg$/i.test(imageUrl)) return null;

    // Step 3: Download the image
    const img = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: CONFIG.images.timeout + 5000,
      headers: WIKI_UA,
    });
    return Buffer.from(img.data);
  } catch (err) {
    // Silent fail — this is a free fallback
    return null;
  }
}

// ── Main Fetch Function ────────────────────────────────────

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

  // 4. Unsplash (full query)
  buf = await unsplash(fullQuery);
  if (buf) { process.stdout.write(`    \x1b[36m✓\x1b[0m unsplsh ${locationName}\n`); writeCache(fullQuery, buf); return buf; }

  // 5. Pexels (name only)
  buf = await pexels(locationName);
  if (buf) { process.stdout.write(`    \x1b[35m~\x1b[0m pexels  ${locationName} (name-only)\n`); writeCache(fullQuery, buf); return buf; }

  // 6. Unsplash (name only)
  buf = await unsplash(locationName);
  if (buf) { process.stdout.write(`    \x1b[36m~\x1b[0m unsplsh ${locationName} (name-only)\n`); writeCache(fullQuery, buf); return buf; }

  // 7. Wikipedia / Wikimedia Commons (free, no key needed)
  buf = await wikimedia(locationName);
  if (buf) { process.stdout.write(`    \x1b[33m✓\x1b[0m wiki    ${locationName}\n`); writeCache(fullQuery, buf); return buf; }

  buf = await wikimedia(`${locationName} ${city}`);
  if (buf) { process.stdout.write(`    \x1b[33m~\x1b[0m wiki    ${locationName} (full)\n`); writeCache(fullQuery, buf); return buf; }

  // 8. City fallback (wiki)
  const cityQuery = `${city} landmark`;
  const cityBuf = readCache(cityQuery) || await pexels(cityQuery) || await unsplash(cityQuery) || await wikimedia(cityQuery);
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
