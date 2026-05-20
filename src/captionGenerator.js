// ============================================================
// Viral Caption Generator
// ============================================================

import { CONFIG } from '../config.js';

/**
 * Generates a viral-style caption for the carousel post.
 *
 * @param {string} city      — destination city
 * @param {number} numDays   — number of itinerary days
 * @param {string} code      — 6-digit access code
 * @param {Array}  itinerary — parsed itinerary data
 * @returns {string} ready-to-paste caption
 */
export function generateCaption(city, numDays, code, itinerary, postType = 'itinerary') {
  const hashtags = `#${city.replace(/\s+/g, '')} #${city.replace(/\s+/g, '')}Travel #TravelItinerary #Tripfy #TravelPlanner #${city.replace(/\s+/g, '')}Guide #TravelTips #Wanderlust #TravelHack #BucketList #EuropeTravel #TravelReels #ExploreMore #HiddenGems #TravelContent #ViralTravel`;

  const hooks = [
    "Tripfy saved me hours planning trips",
    "literally tinder for travel 🔥"
  ];
  
  const hook = hooks[Math.floor(Math.random() * hooks.length)];
  return `${hook}\n\n${hashtags}`;
}

function getEmoji(city) {
  const map = {
    Paris: '\u{1F1EB}\u{1F1F7}',
    London: '\u{1F1EC}\u{1F1E7}',
    Rome: '\u{1F1EE}\u{1F1F9}',
    Tokyo: '\u{1F1EF}\u{1F1F5}',
    Barcelona: '\u{1F1EA}\u{1F1F8}',
    Lisbon: '\u{1F1F5}\u{1F1F9}',
    Berlin: '\u{1F1E9}\u{1F1EA}',
    Amsterdam: '\u{1F1F3}\u{1F1F1}',
    'New York': '\u{1F1FA}\u{1F1F8}',
    Dubai: '\u{1F1E6}\u{1F1EA}',
    Bangkok: '\u{1F1F9}\u{1F1ED}',
    Seoul: '\u{1F1F0}\u{1F1F7}',
    Istanbul: '\u{1F1F9}\u{1F1F7}',
    Prague: '\u{1F1E8}\u{1F1FF}',
    Vienna: '\u{1F1E6}\u{1F1F9}',
    Sydney: '\u{1F1E6}\u{1F1FA}',
    'Mexico City': '\u{1F1F2}\u{1F1FD}',
  };
  return map[city] || '\u2708\uFE0F';
}
