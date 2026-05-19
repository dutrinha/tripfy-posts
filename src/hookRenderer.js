import { createCanvas, loadImage } from '@napi-rs/canvas';
import { CONFIG } from '../config.js';
import { fetchImageForLocation } from './imageFetcher.js';

const W = CONFIG.width;
const H = CONFIG.height;

/**
 * Renders the hook (first page) slide.
 *
 * @param {string} city     - Location string (e.g., 'Paris')
 * @param {number} numDays  - Number of days constraint (e.g. 3)
 * @returns {Buffer} PNG buffer
 */
export async function renderHookSlide(city, numDays) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // 1. Draw Background Image
  // Using city string to fetch a beautiful background
  const bgImgBuffer = await fetchImageForLocation(city);
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

  // 2. Add subtle dark gradient to make text readable
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, 'rgba(0,0,0,0.3)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // 3. Draw Text
  const startX = 110;
  let currentY = 550; // Starting Y coordinate based on firstpage.png mapping

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // "3 Day"
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `600 72px "Inter", sans-serif`;
  
  // Add subtle shadow for white text readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  
  ctx.fillText(`${numDays} Day`, startX, currentY);

  currentY += 140; // Step down for the city name

  // "CITY"
  const displayCity = city ? city.split(',')[0].trim().toUpperCase() : 'LOCATION';
  ctx.fillStyle = '#FCD34D'; // Soft bright yellow
  ctx.font = `bold 186px "Horizon", "Arial Black", sans-serif`;
  
  // Slightly harder shadow for yellow text
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 6;
  ctx.shadowOffsetX = 3;

  ctx.fillText(displayCity, startX, currentY);

  currentY += 150; // Step down for 'Itinerary'
  
  // "Itinerary"
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `600 72px "Inter", sans-serif`;
  
  // Reset shadow for white text
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.shadowOffsetX = 0;

  ctx.fillText('Itinerary', startX, currentY);

  return canvas.toBuffer('image/png');
}
