import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { CONFIG } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Converts raw emoji character(s) to a standard lowercase hex string sequence.
 */
export function emojiToHex(emoji) {
  if (!emoji) return '';
  const codePoints = [];
  for (const char of emoji) {
    const cp = char.codePointAt(0);
    codePoints.push(cp.toString(16));
  }
  return codePoints.filter(cp => cp !== 'fe0f').join('-');
}

/**
 * Downloads and caches the Apple-style color emoji PNG image.
 */
export async function fetchEmojiImage(emoji) {
  if (!emoji) return null;

  const hexStr = emojiToHex(emoji);
  const cacheDir = CONFIG.images.cacheDir || './cache';
  const cachePath = path.join(cacheDir, `emoji_${hexStr}.png`);

  // 1. Check local cache
  try {
    if (fs.existsSync(cachePath)) {
      return fs.readFileSync(cachePath);
    }
  } catch (e) {
    // Ignore cache read errors
  }

  // 2. Fetch from CDNs (Apple-style emojis)
  // We try Emojicdn (elk.sh) first as it defaults to Apple and handles ZWJ / flag sequences automatically.
  // We fall back to jsDelivr with emoji-datasource-apple.
  const urls = [
    `https://emojicdn.elk.sh/${encodeURIComponent(emoji)}`,
    `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${hexStr}.png`
  ];

  for (const url of urls) {
    try {
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: CONFIG.images.timeout || 10000 });
      if (res.status === 200 && res.data) {
        const buffer = Buffer.from(res.data);

        // Save to cache
        try {
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          fs.writeFileSync(cachePath, buffer);
        } catch (e) {
          // Ignore cache write errors (e.g. read-only serverless environment)
        }
        return buffer;
      }
    } catch (err) {
      console.warn(`⚠️ Failed to fetch emoji image from ${url}:`, err.message);
    }
  }

  console.warn(`❌ All emoji CDN fetch attempts failed for "${emoji}" (${hexStr})`);
  return null;
}
