import { createCanvas, loadImage } from '@napi-rs/canvas';
import { CONFIG } from '../config.js';
import { drawImageCover, drawGradientPlaceholder } from './utils.js';
import { fetchEmojiImage } from './emojiHelper.js';

const W = CONFIG.width;
const H = CONFIG.height;

/**
 * Wraps text into multiple lines based on a maximum width constraint.
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  let lines = [];
  let currentLine = words[0] || '';
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Render a slide with a 2x2 grid of photos and a central text.
 */
export async function renderTopPlaceSlide(placeName, imageBuffers) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = CONFIG.colors.background || '#0a0a0a';
  ctx.fillRect(0, 0, W, H);
  
  const gap = 0; // No outline collage
  const colW = (W - gap) / 2;
  const rowH = (H - gap) / 2;
  
  // Draw the 4 images in a 2x2 grid
  const gridPositions = [
    { x: 0, y: 0, w: colW, h: rowH }, // Top-Left
    { x: colW + gap, y: 0, w: colW, h: rowH }, // Top-Right
    { x: 0, y: rowH + gap, w: colW, h: rowH }, // Bottom-Left
    { x: colW + gap, y: rowH + gap, w: colW, h: rowH } // Bottom-Right
  ];
  
  for (let i = 0; i < 4; i++) {
    const pos = gridPositions[i];
    if (i < imageBuffers.length && imageBuffers[i]) {
      try {
        const img = await loadImage(imageBuffers[i]);
        drawImageCover(ctx, img, pos.x, pos.y, pos.w, pos.h);
      } catch (e) {
        drawGradientPlaceholder(ctx, pos.x, pos.y, pos.w, pos.h, i * 50);
      }
    } else {
      drawGradientPlaceholder(ctx, pos.x, pos.y, pos.w, pos.h, i * 50);
    }
  }
  
  // Fetch emoji image
  const emoji = '📍';
  let emojiImg = null;
  try {
    const emojiBuffer = await fetchEmojiImage(emoji);
    if (emojiBuffer) {
      emojiImg = await loadImage(emojiBuffer);
    }
  } catch (err) {
    console.warn(`⚠️ Failed to load fetched emoji image for "${emoji}":`, err);
  }
  
  const fontSize = CONFIG.fonts?.sizes?.locationName || 56;
  ctx.font = `bold ${fontSize}px "Arial", "Segoe UI Emoji", "Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  
  const maxTextWidth = W * 0.8;
  const lines = wrapText(ctx, placeName, maxTextWidth);
  const lineHeight = fontSize * 1.25;
  const totalTextHeight = lines.length * lineHeight;
  
  const startY = (H - totalTextHeight) / 2 + lineHeight / 2;
  const startX = W / 2;

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
    const y = startY + index * lineHeight;

    if (index === 0) {
      const lineWidth = ctx.measureText(line).width;
      const emojiSize = fontSize * 1.0;
      const spacingGap = 12;
      const totalWidth = emojiSize + spacingGap + lineWidth;
      
      const emojiX = startX - totalWidth / 2;
      const textX = startX + (emojiSize + spacingGap) / 2;
      const emojiY = y - emojiSize / 2;

      // Draw outline for first line text
      ctx.strokeText(line, textX, y);

      // Draw emoji shadow & outline/image
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      if (emojiImg) {
        ctx.drawImage(emojiImg, emojiX, emojiY, emojiSize, emojiSize);
      } else {
        ctx.textAlign = 'left';
        ctx.strokeText(emoji, emojiX, y);
      }
      ctx.restore();

      // Draw crisp white text on top (shadow disabled)
      ctx.save();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(line, textX, y);
      
      if (!emojiImg) {
        ctx.textAlign = 'left';
        ctx.fillText(emoji, emojiX, y);
      }
      ctx.restore();
    } else {
      // Draw subsequent lines centered
      ctx.strokeText(line, startX, y);

      ctx.save();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(line, startX, y);
      ctx.restore();
    }
  });
  
  ctx.restore();
  
  return canvas.toBuffer('image/png');
}
