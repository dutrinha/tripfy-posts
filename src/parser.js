// ============================================================
// JSON Itinerary Parser
// ============================================================

/**
 * Parses raw itinerary JSON into a normalized structure.
 * @param {Array} jsonData — raw JSON array from the input file
 * @returns {Array<{day:number, title:string, activities:Array}>}
 */
export function parseItinerary(jsonData) {
  if (!Array.isArray(jsonData)) {
    throw new Error('Invalid itinerary format: expected an array of days.');
  }

  return jsonData.map((dayObj) => {
    if (!dayObj.day || !Array.isArray(dayObj.activities)) {
      throw new Error(`Malformed day object: ${JSON.stringify(dayObj).slice(0, 120)}`);
    }

    return {
      day: dayObj.day,
      title: dayObj.title || `Day ${dayObj.day}`,
      activities: dayObj.activities.map((a) => ({
        id:         a.id || a.place_id || '',
        name:       a.name || a.text || 'Unknown',
        time:       a.time || '',
        type:       a.type || 'popular',
        vicinity:   a.vicinity || '',
        lat:        a.lat,
        lng:        a.lng,
        isFood:     a.isFood || false,
        isInterest: a.is_interest || false,
        category:   a.poiCategory || null,
      })),
    };
  });
}

/**
 * Attempts to extract the city name from activity vicinity strings.
 * Looks for patterns like "75001 Paris" or the second-to-last comma part.
 */
export function extractCity(itinerary) {
  for (const day of itinerary) {
    for (const act of day.activities) {
      if (!act.vicinity) continue;

      const parts = act.vicinity
        .split(/[,\n]/)
        .map((p) => p.trim())
        .filter(Boolean);

      for (let i = parts.length - 2; i >= 0; i--) {
        const part = parts[i];

        // Match "75001 Paris" → "Paris"
        const zipCity = part.match(/^\d{4,6}\s+(.+)/);
        if (zipCity) return zipCity[1];

        // Skip pure numbers and common country names
        if (/^\d+$/.test(part)) continue;
        if (/^(France|Italy|Spain|Germany|UK|USA|Japan|Brazil|Portugal|Mexico|Canada|Australia)$/i.test(part)) continue;

        // Heuristic: if it looks like a city (no digits, > 2 chars) return it
        if (part.length > 2 && !/\d/.test(part) && !part.startsWith('Rue') && !part.startsWith('Quai') && !part.startsWith('Place')) {
          return part;
        }
      }
    }
  }

  return 'Travel';
}

/**
 * Selects the most photogenic activities for the collage,
 * prioritizing landmarks and points of interest.
 */
export function selectBestPhotos(activities, maxCount = 4) {
  const scored = activities.map((a, i) => ({
    ...a,
    _score: (a.isInterest ? 3 : 0) + (a.category ? 1 : 0) + (a.type === 'museum' ? 1 : 0),
    _origIndex: i,
  }));

  scored.sort((a, b) => b._score - a._score || a._origIndex - b._origIndex);
  return scored.slice(0, maxCount);
}
