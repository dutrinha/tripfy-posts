// ============================================================
// Canvas Utility Helpers
// ============================================================

import { CONFIG } from '../config.js';

// ── Rounded Rectangle Path ────────────────────────────────
export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Draw Image with Cover-Fit (like CSS object-fit: cover) ─
export function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const cellRatio = w / h;
  let sx, sy, sw, sh;

  if (imgRatio > cellRatio) {
    // Image is wider — crop horizontal edges
    sh = img.height;
    sw = sh * cellRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    // Image is taller — crop vertical edges
    sw = img.width;
    sh = sw / cellRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// ── Truncate Text to Fit Within Max Width ──────────────────
export function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

// ── Draw Glass Card Background ─────────────────────────────
export function drawGlassCard(ctx, x, y, w, h, r) {
  const c = CONFIG.colors;

  // Drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = c.cardBg;
  ctx.fill();
  ctx.restore();

  // Border
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = c.cardBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Top-edge inner highlight
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  const hl = ctx.createLinearGradient(x, y, x, y + 3);
  hl.addColorStop(0, c.cardHighlight);
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(x, y, w, 3);
  ctx.restore();
}

// ── Draw a Gradient Placeholder (when no photo available) ──
export function drawGradientPlaceholder(ctx, x, y, w, h, seed) {
  const hue1 = (seed * 137 + 42) % 360;
  const hue2 = (hue1 + 45) % 360;
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, `hsl(${hue1}, 55%, 28%)`);
  grad.addColorStop(1, `hsl(${hue2}, 65%, 18%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Subtle icon-like circles for visual interest
  ctx.globalAlpha = 0.06;
  ctx.beginPath();
  ctx.arc(x + w * 0.7, y + h * 0.4, w * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.globalAlpha = 1.0;
}

// ── Vignette Overlay ───────────────────────────────────────
export function drawVignette(ctx, w, h) {
  const grad = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.35,
    w / 2, h / 2, Math.max(w, h) * 0.75
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ── Brand Gradient (purple → blue) ─────────────────────────
export function createBrandGradient(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, CONFIG.colors.primary);
  g.addColorStop(1, CONFIG.colors.secondary);
  return g;
}
