# ✈ Tripfy Carousel Generator

Automatically transforms Tripfy travel itinerary JSON into stunning Instagram/TikTok carousel slides ready to go viral.

## Features

- **Vertical timeline layout** — each location gets its own row with photo + details
- **Auto image fetching** — Wikipedia (free), Pexels, Unsplash, or local files
- **Travel time estimation** — calculates walking/driving time between locations from coordinates
- **Blurred background** — uses the best location photo as an atmospheric backdrop
- **CTA slide** — converts viewers with a 6-digit itinerary code
- **Viral caption** — ready-to-paste caption with CTA + hashtags
- **Disk caching** — re-runs are instant (no repeated API calls)
- **1080×1350px** — optimal format for Instagram carousels

## Quick Start

```bash
# Install dependencies
npm install

# Generate slides (works out-of-the-box with Wikipedia images)
node generate.js --input example.json --code 4F7X92 --city Paris
```

Output: `./output/slide_01_day1.png`, `slide_02_day2.png`, ..., `slide_NN_cta.png`, `caption.txt`

## Better Image Quality (Optional)

For higher-quality photos, add a free Pexels API key:

```bash
cp .env.example .env
# Edit .env and add your key:
# PEXELS_API_KEY=your_key_here
```

Get a free key at [pexels.com/api](https://www.pexels.com/api/)

## CLI Options

| Flag | Default | Description |
|------|---------|-------------|
| `--input` | `example.json` | Path to the itinerary JSON file |
| `--code` | `000000` | 6-digit code displayed on the CTA slide |
| `--city` | Auto-detected | Override city name for title and image search |

## JSON Format

```json
[
  {
    "day": 1,
    "title": "Dia 1",
    "activities": [
      {
        "name": "Le Louvre",
        "time": "09:00",
        "lat": 48.8605,
        "lng": 2.3375,
        "type": "museum",
        "vicinity": "93 Rue de Rivoli, 75001 Paris, France",
        "poiCategory": "Landmark",
        "is_interest": true
      }
    ]
  }
]
```

## Local Image Overrides

Place custom images in `./images/` named by place ID or day-index:

```
images/
├── I93C4DAE17C80105A.jpg    # by place_id
├── day1-0.jpg                # by day number and index
└── day1-1.png
```

## Customization

Edit `config.js` to change colors, fonts, spacing, branding, and all visual tokens.

## License

Private — Tripfy
