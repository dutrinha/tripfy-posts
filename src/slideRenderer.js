// ============================================================
// Day Slide Renderer — Stacked Photo Strips
// ============================================================
// Generates a 1080×1350 px slide with the design:
//   • Full-width photo strip per location (stacked vertically)
//   • Location name overlaid in large bold white text
//   • Travel time pill at each strip boundary
//   • "Dia X:" label in top-right corner
// ============================================================

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { CONFIG } from '../config.js';
import { roundRect, drawImageCover, drawGradientPlaceholder, truncateText } from './utils.js';

const W = CONFIG.width;
const H = CONFIG.height;
const F = CONFIG.fonts.family;

// ── Haversine Distance (km) ───────────────────────────────

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function travelEstimate(distKm) {
  if (distKm < 1.5) {
    return { mins: Math.max(2, Math.round(distKm * 13)), mode: 'walk' };
  }
  return { mins: Math.max(3, Math.round(distKm * 3)), mode: 'drive' };
}

// ── Travel Time Pill ──────────────────────────────────────

function drawTravelPill(ctx, text, x, y) {
  ctx.font = `bold 16px ${F}`;
  const tw = ctx.measureText(text).width;
  const pw = tw + 28;
  const ph = 30;

  // Pill background
  roundRect(ctx, x, y - ph / 2, pw, ph, ph / 2);
  ctx.fillStyle = 'rgba(30, 30, 30, 0.85)';
  ctx.fill();

  // Pill text
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 14, y + 1);
}

// ── Main Export ─────────────────────────────────────────────

export async function renderDaySlide(dayData, imageBuffers, city, slideIndex, totalSlides) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const activities = dayData.activities;
  const n = activities.length;
  const stripH = Math.floor(H / n);

  // ══════════════════════════════════════════════════════
  // Pass 1: Draw all photo strips (images, gradients, text)
  // ══════════════════════════════════════════════════════
  for (let i = 0; i < n; i++) {
    const act = activities[i];
    const y = i * stripH;
    const h = i === n - 1 ? H - y : stripH; // last strip fills remaining

    // ── Photo strip (full-width) ──
    if (i < imageBuffers.length && imageBuffers[i]) {
      try {
        const img = await loadImage(imageBuffers[i]);
        drawImageCover(ctx, img, 0, y, W, h);
      } catch {
        drawGradientPlaceholder(ctx, 0, y, W, h, i * 53 + 10);
      }
    } else {
      drawGradientPlaceholder(ctx, 0, y, W, h, i * 53 + 10);
    }

    // ── Bottom gradient for text readability ──
    const grad = ctx.createLinearGradient(0, y + h * 0.3, 0, y + h);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.15)');
    grad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, W, h);

    // ── Top gradient (light, for first strip "Dia X:" readability) ──
    if (i === 0) {
      const topGrad = ctx.createLinearGradient(0, y, 0, y + 80);
      topGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
      topGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, y, W, 80);
    }

    // ── Location name (large, bold, white) ──
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    ctx.font = `bold 44px ${F}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';

    const name = truncateText(ctx, act.name, W - 60);
    ctx.fillText(name, 32, y + h - 38);
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════
  // Pass 2: Draw travel time pills ON TOP of all strips
  // ══════════════════════════════════════════════════════
  for (let i = 0; i < n - 1; i++) {
    const act = activities[i];
    const next = activities[i + 1];
    const y = i * stripH;
    const h = i === n - 1 ? H - y : stripH;

    if (act.lat && act.lng && next.lat && next.lng) {
      const dist = haversine(act.lat, act.lng, next.lat, next.lng);
      const travel = travelEstimate(dist);
      const modeText = travel.mode === 'walk' ? 'Minute walk' : 'Minute drive';
      const pillText = `${travel.mins} ${modeText}`;
      drawTravelPill(ctx, pillText, 22, y + h);
    }
  }

  // ══════════════════════════════════════════════════════
  // "Dia X:" label — top-right corner
  // ══════════════════════════════════════════════════════
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;

  ctx.font = `bold 50px ${F}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`Day ${dayData.day}:`, W - 35, 25);
  ctx.restore();

  return canvas.toBuffer('image/png');
}
