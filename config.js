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
    background: '#0a0a0a',

    // Brand gradient
    primary: '#6C63FF',     // purple
    primaryLight: '#8B85FF',
    secondary: '#3B82F6',     // blue
    accent: '#F97316',     // orange (CTA)
    accentGold: '#FBBF24',

    // Text
    textWhite: '#FFFFFF',
    textLight: 'rgba(255,255,255,0.82)',
    textMuted: 'rgba(255,255,255,0.48)',

    // Glass card
    cardBg: 'rgba(10,10,10,0.72)',
    cardBorder: 'rgba(255,255,255,0.12)',
    cardHighlight: 'rgba(255,255,255,0.10)',
  },

  // ── Typography ───────────────────────────────────────────
  fonts: {
    family: 'Inter',   // registered custom font
    sizes: {
      travelPill: 16,
      locationName: 44,
      dayNumber: 50,
      ctaHeading: 72,
      ctaShareCodeLabel: 72,
      ctaCode: 72,
      hookText: 36,  // UGC hook text size
    },
  },

  // ── Text Templates ───────────────────────────────────────
  templates: {
    slide: {
      dayLabel: 'Day {day}:',
      walkText: 'Minute walk',
      driveText: 'Minute drive',
    },
    cta: {
      hooks: {
        itinerary: [
          "POV: you planned your entire trip in literal seconds on Tripfy",
          "Stop spending hours on itineraries. I planned this whole trip in seconds on Tripfy",
          "I built this custom 3D trip in literal seconds with Tripfy",
          "Hate planning trips? Tripfy made this itinerary for me in seconds without the stress"
        ],
        topPlaces: [
          "I found all these spots on Tripfy just by swiping like tinder 🔥",
          "I literally planned my dream vacation on Tripfy just by swiping",
          "Swipe right on places you love, and Tripfy builds the trip for you",
          "Finding spots is as easy as swiping on tinder with tripfy 🤯"
        ]
      }
    }
  },

  // ── UGC Hook & Emoji Configurations ──────────────────────
  hook: {
    // Layout and positioning for the hook text
    position: {
      x: 'center', // 'left', 'center', 'right'
      y: 'center', // 'top', 'center', 'bottom'
      offsetX: 0,
      offsetY: 0,
    },

    // Pexels search query for the hook background image.
    // Use (CITY) to inject the current city name.
    hookFetchingText: '(CITY) street aesthetic vlog',

    // Overrides for specific cities to guarantee iconic landmarks with a UGC vibe
    citySpecificQueries: {
      'paris': 'eiffel tower ugc from afar',
      'london': 'big ben sunny blue sky portrait for afar',
      'rome': 'colosseum sunny blue sky portrait for afar',
      'new york': 'times square street aesthetic vlog',
      'tokyo': 'shibuya crossing street aesthetic vlog'
    },

    // Randomized templates.
    // - COUNTRY: the city/country name (lowercase, e.g. "paris")
    // - DAYS: the number of days the itinerary has (e.g. "3")
    // - {emoji} or (country emoji): the country flag emoji (e.g. "🇫🇷")
    templates: {
      itinerary: [
        'DAYS days itinerary in COUNTRY {emoji}',
        'how to spend DAYS days in COUNTRY {emoji}'
      ],
      topPlaces: [
        'things to do in COUNTRY {emoji}',
        'must visit places in COUNTRY {emoji}',
        'places to visit in COUNTRY {emoji}',
        'best spots in COUNTRY {emoji}',
        'things you can\'t miss in COUNTRY {emoji}'
      ]
    },

    // Mapping of common cities to country name and flag emoji
    cityMap: {
      'paris': { country: 'France', emoji: '🇫🇷' },
      'london': { country: 'United Kingdom', emoji: '🇬🇧' },
      'rome': { country: 'Italy', emoji: '🇮🇹' },
      'milan': { country: 'Italy', emoji: '🇮🇹' },
      'florence': { country: 'Italy', emoji: '🇮🇹' },
      'venice': { country: 'Italy', emoji: '🇮🇹' },
      'madrid': { country: 'Spain', emoji: '🇪🇸' },
      'barcelona': { country: 'Spain', emoji: '🇪🇸' },
      'berlin': { country: 'Germany', emoji: '🇩🇪' },
      'munich': { country: 'Germany', emoji: '🇩🇪' },
      'tokyo': { country: 'Japan', emoji: '🇯🇵' },
      'kyoto': { country: 'Japan', emoji: '🇯🇵' },
      'osaka': { country: 'Japan', emoji: '🇯🇵' },
      'new york': { country: 'United States', emoji: '🇺🇸' },
      'los angeles': { country: 'United States', emoji: '🇺🇸' },
      'san francisco': { country: 'United States', emoji: '🇺🇸' },
      'miami': { country: 'United States', emoji: '🇺🇸' },
      'lisbon': { country: 'Portugal', emoji: '🇵🇹' },
      'porto': { country: 'Portugal', emoji: '🇵🇹' },
      'amsterdam': { country: 'Netherlands', emoji: '🇳🇱' },
      'brussels': { country: 'Belgium', emoji: '🇧🇪' },
      'vienna': { country: 'Austria', emoji: '🇦🇹' },
      'zurich': { country: 'Switzerland', emoji: '🇨🇭' },
      'geneva': { country: 'Switzerland', emoji: '🇨🇭' },
      'athens': { country: 'Greece', emoji: '🇬🇷' },
      'dublin': { country: 'Ireland', emoji: '🇮🇪' },
      'toronto': { country: 'Canada', emoji: '🇨🇦' },
      'vancouver': { country: 'Canada', emoji: '🇨🇦' },
      'montreal': { country: 'Canada', emoji: '🇨🇦' },
      'sydney': { country: 'Australia', emoji: '🇦🇺' },
      'melbourne': { country: 'Australia', emoji: '🇦🇺' },
      'rio de janeiro': { country: 'Brazil', emoji: '🇧🇷' },
      'sao paulo': { country: 'Brazil', emoji: '🇧🇷' },
      'buenos aires': { country: 'Argentina', emoji: '🇦🇷' },
      'mexico city': { country: 'Mexico', emoji: '🇲🇽' },
      'cancun': { country: 'Mexico', emoji: '🇲🇽' },
      'singapore': { country: 'Singapore', emoji: '🇸🇬' },
      'bangkok': { country: 'Thailand', emoji: '🇹🇭' },
      'phuket': { country: 'Thailand', emoji: '🇹🇭' },
      'seoul': { country: 'South Korea', emoji: '🇰🇷' },
      'beijing': { country: 'China', emoji: '🇨🇳' },
      'shanghai': { country: 'China', emoji: '🇨🇳' },
      'cape town': { country: 'South Africa', emoji: '🇿🇦' },
      'cairo': { country: 'Egypt', emoji: '🇪🇬' },
      'dubai': { country: 'United Arab Emirates', emoji: '🇦🇪' },
    },

    // Mapping of country names to flag emojis
    countryMap: {
      'france': '🇫🇷',
      'italy': '🇮🇹',
      'spain': '🇪🇸',
      'germany': '🇩🇪',
      'united kingdom': '🇬🇧',
      'uk': '🇬🇧',
      'united states': '🇺🇸',
      'usa': '🇺🇸',
      'japan': '🇯🇵',
      'brazil': '🇧🇷',
      'portugal': '🇵🇹',
      'mexico': '🇲🇽',
      'canada': '🇨🇦',
      'australia': '🇦🇺',
      'greece': '🇬🇷',
      'turkey': '🇹🇷',
      'netherlands': '🇳🇱',
      'switzerland': '🇨🇭',
      'belgium': '🇧🇪',
      'austria': '🇦🇹',
      'sweden': '🇸🇪',
      'norway': '🇳🇴',
      'denmark': '🇩🇰',
      'finland': '🇫🇮',
      'ireland': '🇮🇪',
      'thailand': '🇹🇭',
      'singapore': '🇸🇬',
      'south korea': '🇰🇷',
      'china': '🇨🇳',
      'india': '🇮🇳',
      'south africa': '🇿🇦',
      'argentina': '🇦🇷',
      'chile': '🇨🇱',
      'colombia': '🇨🇴',
      'peru': '🇵🇪',
      'egypt': '🇪🇬',
      'morocco': '🇲🇦',
      'united arab emirates': '🇦🇪',
      'uae': '🇦🇪'
    }
  },

  // ── Layout Tokens ────────────────────────────────────────
  layout: {
    cardMarginX: 40,
    cardPadding: 32,
    cardBorderRadius: 28,
    cardBottomMargin: 30,
    timelineEntryH: 46,
    timelineDotR: 6,
    timelineDotX: 40,   // relative to card left
    timelineTimeX: 62,   // relative to card left
    timelineNameX: 150,  // relative to card left
    dayHeaderX: 60,
    dayHeaderY: 58,
  },

  // ── Branding ─────────────────────────────────────────────
  branding: {
    appName: 'tripfy',
    tagline: 'Your AI Travel Companion',
    handle: '@tripfy.app',
  },

  // ── Output ───────────────────────────────────────────────
  output: {
    directory: './output',
    format: 'png',
  },

  // ── Image Fetching ───────────────────────────────────────
  images: {
    cacheDir: './cache',
    timeout: 12000,   // ms per request
    maxRetries: 2,
    cityFallbackQuery: '{city} landmark',
  },
};
