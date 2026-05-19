// ============================================================
// CTA (Call-to-Action) Slide Renderer
// ============================================================

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { CONFIG } from '../config.js';
import fs from 'fs';
import path from 'path';

const W = CONFIG.width;
const H = CONFIG.height;

function drawBackground(ctx) {
  ctx.fillStyle = '#0c0c0cff';
  ctx.fillRect(0, 0, W, H);
}

export async function renderCtaSlide(code, city, slideIndex, totalSlides) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx);

  // 1. Draw Text at the Top
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Main Header
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 72px ${CONFIG.fonts.family}`;
  ctx.fillText('Check this itinerary in', W / 2, 200);
  ctx.fillText('3D on Tripfy!', W / 2, 260);

  // "Code:" Label (Moved to the right side)
  ctx.fillStyle = '#A1A1AA'; // Light Grayish color
  ctx.font = `600 42px ${CONFIG.fonts.family}`;
  ctx.fillText('Share Code:', 830, 550);

  // The actual Code
  ctx.fillStyle = '#FFFFFF'; // Bright white for maximum contrast
  ctx.font = `bold 84px ${CONFIG.fonts.family}`;
  ctx.fillText(code, 830, 640);

  // 2. Draw the phone asset properly scaled
  try {
    const phoneImgPath = path.resolve('./assets/png phone.png');
    if (fs.existsSync(phoneImgPath)) {
      const phoneImg = await loadImage(phoneImgPath);
      
      const scale = 0.70; // 70% scale
      const targetW = phoneImg.width * scale;
      const targetH = phoneImg.height * scale;
      
      // Position to the left (-40px offset) and 15px margin from the bottom
      const phoneX = -40;
      const phoneY = H - targetH - 45; 
      
      ctx.drawImage(phoneImg, 0, 0, phoneImg.width, phoneImg.height, phoneX, phoneY, targetW, targetH);
    } else {
      console.warn('⚠️ Missing "png phone.png" asset in assets folder!');
    }
  } catch (err) {
    console.warn('⚠️ Failed to load "png phone.png" asset:', err.message);
  }

  // 3. Draw App Store Badge at bottom right perfectly matching the mockup
  try {
    const badgePath = path.resolve('./assets/Download_on_the_App_Store_Badge.svg.png');
    if (fs.existsSync(badgePath)) {
      const badgeImg = await loadImage(badgePath);
      
      const badgeW = 380; 
      const badgeH = badgeImg.height * (badgeW / badgeImg.width);
      
      const btnX = W - badgeW - 60; 
      const btnY = H - badgeH - 220; 
      
      ctx.drawImage(badgeImg, btnX, btnY, badgeW, badgeH);
    } else {
      console.warn('⚠️ Missing "Download_on_the_App_Store_Badge.svg.png" in assets folder!');
    }
  } catch (err) {
    console.warn('⚠️ Failed to load App Store badge:', err.message);
  }

  return canvas.toBuffer('image/png');
}
