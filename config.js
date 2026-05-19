// ============================================================
// Tripfy Carousel Generator — Design Configuration
// ============================================================
// All visual tokens live here. Tweak colors, fonts, spacing,
// and branding without touching rendering logic.
// ============================================================

export const CONFIG = {
  // ── Canvas Dimensions (Instagram carousel optimal) ───────
  width: 1080,
  height: 1350,

  // ── Photo Grid ───────────────────────────────────────────
  grid: {
    gap: 6,            // gap between photos in px
    maxPhotos: 4,      // max photos in the collage per day
  },

  // ── Color Palette ────────────────────────────────────────
  colors: {
    background:   '#0a0a0a',

    // Brand gradient
    primary:      '#6C63FF',     // purple
    primaryLight: '#8B85FF',
    secondary:    '#3B82F6',     // blue
    accent:       '#F97316',     // orange (CTA)
    accentGold:   '#FBBF24',

    // Text
    textWhite:    '#FFFFFF',
    textLight:    'rgba(255,255,255,0.82)',
    textMuted:    'rgba(255,255,255,0.48)',

    // Glass card
    cardBg:       'rgba(10,10,10,0.72)',
    cardBorder:   'rgba(255,255,255,0.12)',
    cardHighlight:'rgba(255,255,255,0.10)',
  },

  // ── Typography ───────────────────────────────────────────
  fonts: {
    family: 'Arial',   // safe cross-platform default
    sizes: {
      dayLabel:       16,
      dayNumber:      72,
      cityName:       26,
      time:           20,
      locationName:   20,
      branding:       17,
      slideCounter:   14,
      ctaHeading:     46,
      ctaSubheading:  24,
      ctaCode:        68,
      ctaCodeLabel:   18,
      ctaSmall:       19,
      ctaHandle:      22,
    },
  },

  // ── Layout Tokens ────────────────────────────────────────
  layout: {
    cardMarginX:       40,
    cardPadding:       32,
    cardBorderRadius:  28,
    cardBottomMargin:  30,
    timelineEntryH:    46,
    timelineDotR:      6,
    timelineDotX:      40,   // relative to card left
    timelineTimeX:     62,   // relative to card left
    timelineNameX:     150,  // relative to card left
    dayHeaderX:        60,
    dayHeaderY:        58,
  },

  // ── Branding ─────────────────────────────────────────────
  branding: {
    appName:  'tripfy',
    tagline:  'Your AI Travel Companion',
    handle:   '@tripfy.app',
  },

  // ── Output ───────────────────────────────────────────────
  output: {
    directory: './output',
    format:    'png',
  },

  // ── Image Fetching ───────────────────────────────────────
  images: {
    cacheDir:   './cache',
    timeout:    12000,   // ms per request
    maxRetries: 2,
  },
};
