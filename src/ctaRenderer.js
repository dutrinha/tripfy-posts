// ============================================================
// CTA (Call-to-Action) Slide Renderer
// ============================================================

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { CONFIG } from '../config.js';
import { fetchHookImage } from './imageFetcher.js';

const W = CONFIG.width;
const H = CONFIG.height;

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

export async function renderCtaSlide(code, city, slideIndex, totalSlides, postType = 'itinerary') {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // 1. Draw Background Image
  const bgImgBuffer = await fetchHookImage(city);
  if (bgImgBuffer) {
    try {
      const bgImg = await loadImage(bgImgBuffer);
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
      console.warn('⚠️ Failed to load background image for CTA slide.', e);
      ctx.fillStyle = '#1c1f26';
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    ctx.fillStyle = '#1c1f26';
    ctx.fillRect(0, 0, W, H);
  }

  // 2. Add subtle dark gradient overlay for readability
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, 'rgba(0,0,0,0.25)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // 3. CTA UGC Text
  const ctaHooksMap = CONFIG.templates?.cta?.hooks || {};
  const ctaHooks = ctaHooksMap[postType] || ctaHooksMap.itinerary || [
    "i planned this entire trip on Tripfy in seconds ✈️"
  ];
  const randomHook = ctaHooks[Math.floor(Math.random() * ctaHooks.length)];
  
  const textLines = [
    randomHook,
    `(use code ${code} in app to see it in 3D)`
  ].join('\n');
  
  // 4. Render UGC Text
  const fontSize = CONFIG.fonts.sizes.hookText || 56;
  ctx.font = `bold ${fontSize}px "${CONFIG.fonts.family}", "Arial", "Segoe UI Emoji", "Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;

  const maxTextWidth = W * 0.70;
  const lines = wrapText(ctx, textLines, maxTextWidth);
  const lineHeight = fontSize * 1.3;
  const totalTextHeight = lines.length * lineHeight;
  
  const startY = (H - totalTextHeight) / 2 + lineHeight / 2;
  const startX = W / 2;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.lineWidth = Math.max(5, fontSize * 0.12);
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  lines.forEach((line, index) => {
    const x = startX;
    const y = startY + index * lineHeight;

    // Set font size smaller for the CTA line
    const isCtaLine = index === lines.length - 1 && line.includes(code);
    if (isCtaLine) {
      ctx.font = `bold ${fontSize * 0.75}px "${CONFIG.fonts.family}", "Arial", "Segoe UI Emoji", "Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    } else {
      ctx.font = `bold ${fontSize}px "${CONFIG.fonts.family}", "Arial", "Segoe UI Emoji", "Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    }

    ctx.strokeText(line, x, y);

    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    if (isCtaLine) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    } else {
      ctx.fillStyle = '#FFFFFF';
    }
    
    ctx.fillText(line, x, y);
    ctx.restore();
  });

  ctx.restore();

  return canvas.toBuffer('image/png');
}

