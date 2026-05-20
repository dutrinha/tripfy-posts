import { createCanvas, loadImage } from '@napi-rs/canvas';
import { CONFIG } from '../config.js';
import { fetchImageForLocation, fetchHookImage } from './imageFetcher.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

import { fetchEmojiImage } from './emojiHelper.js';

const W = CONFIG.width;
const H = CONFIG.height;

/**
 * Maps cities/countries to their flag emojis.
 */
export function getCountryAndEmoji(city, itinerary) {
  const cityLower = city ? city.toLowerCase().trim() : '';

  // 1. Try to extract country from itinerary vicinities
  let countryName = '';
  if (itinerary && Array.isArray(itinerary)) {
    for (const day of itinerary) {
      for (const act of day.activities) {
        if (!act.vicinity) continue;
        const parts = act.vicinity.split(/[,\n]/).map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) {
          const lastPart = parts[parts.length - 1];
          if (lastPart.length > 2 && !/\d/.test(lastPart)) {
            countryName = lastPart;
            break;
          }
        }
      }
      if (countryName) break;
    }
  }

  const cityMap = CONFIG.hook?.cityMap || {};
  const countryMap = CONFIG.hook?.countryMap || {};

  // Try matching city name directly to our city list
  for (const [knownCity, info] of Object.entries(cityMap)) {
    if (cityLower.includes(knownCity)) {
      return info;
    }
  }

  // Trim and check country from itinerary vicinities
  if (countryName) {
    const countryLower = countryName.toLowerCase().trim();
    if (countryMap[countryLower]) {
      return { country: countryName, emoji: countryMap[countryLower] };
    }
    for (const [name, emoji] of Object.entries(countryMap)) {
      if (countryLower.includes(name) || name.includes(countryLower)) {
        return { country: countryName, emoji };
      }
    }
    return { country: countryName, emoji: '✈️' };
  }

  // Check if the city parameter itself contains a country or is a country
  for (const [name, emoji] of Object.entries(countryMap)) {
    if (cityLower.includes(name)) {
      return { country: name.charAt(0).toUpperCase() + name.slice(1), emoji };
    }
  }

  return { country: '', emoji: '✈️' };
}

/**
 * Formats a hook template string by replacing placeholders.
 */
function formatHookText(template, locationName, numDays, emoji) {
  let text = template;
  
  // 1. Replace emoji placeholders FIRST to avoid overlapping with location placeholders
  text = text.replace(/\(country emoji\)/gi, emoji);
  text = text.replace(/country emoji/gi, emoji);
  text = text.replace(/{emoji}/gi, emoji);

  // 2. Replace location/country placeholders (case-sensitive for uppercase, and bracketed formats)
  text = text.replace(/\bCOUNTRY\b/g, locationName);
  text = text.replace(/\bcountry\b/g, locationName);
  text = text.replace(/{location}/gi, locationName);
  text = text.replace(/{country}/gi, locationName);

  // 3. Replace day count placeholders (case-sensitive for uppercase, and bracketed formats)
  text = text.replace(/\bDAYS\b/g, numDays);
  text = text.replace(/{days}/gi, numDays);

  return text;
}

/**
 * Wraps text into multiple lines based on a maximum width constraint, supporting explicit newlines.
 */
function wrapText(ctx, text, maxWidth) {
  const paragraphs = text.split('\n');
  const lines = [];
  
  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let currentLine = words[0] || '';
    
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}

/**
 * Renders the hook (first page) slide as a beautiful centered UGC slide.
 *
 * @param {string} city     - Location string (e.g., 'Paris')
 * @param {number} numDays  - Number of days constraint (e.g. 3)
 * @param {Array} itinerary - Full itinerary array for country/flag extraction
 * @returns {Buffer} PNG buffer
 */
export async function renderHookSlide(city, numDays, itinerary, postType = 'itinerary') {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // 1. Draw Background Image
  // Always gets Pexels API: (CITY) famous places pov
  const bgImgBuffer = await fetchHookImage(city);
  if (bgImgBuffer) {
    try {
      const bgImg = await loadImage(bgImgBuffer);
      // Cover the canvas
      let drawW, drawH;
      const ratio = bgImg.width / bgImg.height;
      if (W / H > ratio) {
        drawW = W;
        drawH = W / ratio;
      } else {
        drawH = H;
        drawW = H * ratio;
      }
      ctx.drawImage(bgImg, (W - drawW) / 2, (H - drawH) / 2, drawW, drawH);
    } catch (e) {
      console.warn('⚠️ Failed to load background image for hook slide. Using dark fill.', e);
      ctx.fillStyle = '#1c1f26';
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    ctx.fillStyle = '#1c1f26';
    ctx.fillRect(0, 0, W, H);
  }

  // 2. Add subtle dark gradient overlay for maximum readability
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, 'rgba(0,0,0,0.25)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // 3. Select and Format UGC Hook Text
  const locationName = city ? city.split(',')[0].trim().toLowerCase() : 'travel';
  const countryInfo = getCountryAndEmoji(city, itinerary);
  const emoji = countryInfo.emoji;

  const templates = CONFIG.hook.templates[postType] || CONFIG.hook.templates.itinerary;

  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  const hookText = formatHookText(randomTemplate, locationName, numDays, emoji);
  console.log(`       [UGC Hook] Text generated: "${hookText}" (using template: "${randomTemplate}")`);

  // Strip emoji from the drawn text so it doesn't get drawn as letters like FR
  let plainText = hookText;
  if (emoji) {
    plainText = hookText.replace(emoji, '').trim();
  }

  // Fetch emoji image if present
  let emojiImg = null;
  if (emoji) {
    const emojiBuffer = await fetchEmojiImage(emoji);
    if (emojiBuffer) {
      try {
        emojiImg = await loadImage(emojiBuffer);
      } catch (err) {
        console.warn(`⚠️ Failed to load fetched emoji image for "${emoji}":`, err);
      }
    }
  }

  // 4. Wrap and Render centered text with bold UGC style
  const fontSize = CONFIG.fonts.sizes.hookText || 56;
  ctx.font = `bold ${fontSize}px "${CONFIG.fonts.family}", "Arial", "Segoe UI Emoji", "Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;

  // Use a narrower text width (64% of canvas width) to match UGC mobile screens and force elegant multi-line wrapping
  const maxTextWidth = W * 0.64;
  const lines = wrapText(ctx, plainText, maxTextWidth);
  const lineHeight = fontSize * 1.25;
  const totalTextHeight = lines.length * lineHeight;
  
  const pos = CONFIG.hook?.position || { x: 'center', y: 'center', offsetX: 0, offsetY: 0 };
  
  let startY = (H - totalTextHeight) / 2 + lineHeight / 2;
  if (pos.y === 'top') startY = lineHeight / 2;
  else if (pos.y === 'bottom') startY = H - totalTextHeight + lineHeight / 2;
  startY += (pos.offsetY || 0);

  let startX = W / 2;
  if (pos.x === 'left') startX = maxTextWidth / 2; 
  else if (pos.x === 'right') startX = W - maxTextWidth / 2;
  startX += (pos.offsetX || 0);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Outline setup
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.lineWidth = Math.max(5, fontSize * 0.12);
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  // Drop shadow setup (applied to the outline/background)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  // Render lines
  lines.forEach((line, index) => {
    const x = startX;
    const y = startY + index * lineHeight;

    // Draw the dark outline with drop shadow
    ctx.strokeText(line, x, y);

    // Draw the crisp white text on top (shadow disabled so it's sharp)
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(line, x, y);
    ctx.restore();

    // If this is the last line, draw the emoji next to it
    if (index === lines.length - 1) {
      if (emojiImg) {
        const lineWidth = ctx.measureText(line).width;
        const emojiSize = fontSize * 1.0;
        const gap = 12;
        const emojiX = startX + lineWidth / 2 + gap;
        const emojiY = y - emojiSize / 2;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.drawImage(emojiImg, emojiX, emojiY, emojiSize, emojiSize);
        ctx.restore();
      } else if (emoji) {
        // Fallback: draw emoji as text at the end of the line
        const lineWidth = ctx.measureText(line).width;
        const gap = 12;
        const emojiX = startX + lineWidth / 2 + gap;

        ctx.save();
        ctx.textAlign = 'left';
        ctx.strokeText(emoji, emojiX, y);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(emoji, emojiX, y);
        ctx.restore();
      }
    }
  });

  ctx.restore();

  return canvas.toBuffer('image/png');
}
