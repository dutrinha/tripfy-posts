import fs from 'fs';
import path from 'path';
import { fetchMultipleImagesForLocation } from './imageFetcher.js';
import { renderTopPlaceSlide } from './topPlacesRenderer.js';
import { renderHookSlide } from './hookRenderer.js';
import { renderCtaSlide } from './ctaRenderer.js';
import { generateCaption } from './captionGenerator.js';
import { CONFIG } from '../config.js';

export async function generateTopPlacesCarousel(items, code, city) {
  console.log();
  console.log('  \x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('  \x1b[1m  Tripfy Top Places Generator\x1b[0m');
  console.log('  \x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log();

  const totalSlides = items.length + 2; // hook + places + CTA
  
  console.log(`       ${items.length} place(s) to generate · City: ${city}`);
  console.log(`       Output: ${totalSlides} slides`);
  console.log();

  const outDir = CONFIG.output.directory;
  let isWritable = true;
  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  } catch (e) {
    isWritable = false;
  }

  const generatedFiles = [];

  // 0. Render Hook Slide
  console.log('  \x1b[36m[1/4]\x1b[0m Rendering hook slide...');
  const mockItinerary = items.map((act, i) => ({ day: i+1, activities: [act] }));
  const hookBuffer = await renderHookSlide(city, items.length, mockItinerary, 'topPlaces');
  
  const hookFilename = `slide_00_hook.png`;
  const hookFilepath = path.join(outDir, hookFilename);
  if (isWritable) {
    try {
      fs.writeFileSync(hookFilepath, hookBuffer);
      console.log(`       \x1b[32m→\x1b[0m Saved: ${hookFilename} (${(hookBuffer.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.warn('⚠️ Could not write hook slide to disk:', e.message);
    }
  }
  generatedFiles.push({
    name: hookFilename,
    base64: hookBuffer.toString('base64'),
    path: hookFilepath
  });
  console.log();

  // 1. Render Top Places Slides
  console.log('  \x1b[36m[2/4]\x1b[0m Rendering places slides...');
  for (let i = 0; i < items.length; i++) {
    const place = items[i];
    const name = place.name || place.text || 'Unknown Place';
    console.log(`  \x1b[33mPlace ${i + 1}/${items.length}\x1b[0m — ${name}`);

    // Fetch 4 images
    const imageBuffers = await fetchMultipleImagesForLocation(name, city, 4);

    // Render 2x2 slide
    const pngBuffer = await renderTopPlaceSlide(name, imageBuffers);

    const filename = `slide_${String(i + 1).padStart(2, '0')}_place_${i}.png`;
    const filepath = path.join(outDir, filename);

    if (isWritable) {
      try {
        fs.writeFileSync(filepath, pngBuffer);
        console.log(`       \x1b[32m→\x1b[0m Saved: ${filename} (${(pngBuffer.length / 1024).toFixed(0)} KB)`);
      } catch (e) {
        console.warn(`⚠️ Could not write ${filename} to disk:`, e.message);
      }
    }

    generatedFiles.push({
      name: filename,
      base64: pngBuffer.toString('base64'),
      path: filepath
    });
    console.log();
  }

  // 2. Render CTA Slide
  console.log('  \x1b[36m[3/4]\x1b[0m Rendering CTA slide...');
  const ctaIndex = items.length + 1;
  // We'll pass a mock itinerary for CTA if it needs it, though typically code & city is enough
  const ctaBuffer = await renderCtaSlide(code, city, ctaIndex, totalSlides, 'topPlaces');

  const ctaFilename = `slide_${String(ctaIndex).padStart(2, '0')}_cta.png`;
  const ctaFilepath = path.join(outDir, ctaFilename);

  if (isWritable) {
    try {
      fs.writeFileSync(ctaFilepath, ctaBuffer);
      console.log(`       \x1b[32m→\x1b[0m Saved: ${ctaFilename} (${(ctaBuffer.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.warn('⚠️ Could not write CTA slide to disk:', e.message);
    }
  }

  generatedFiles.push({
    name: ctaFilename,
    base64: ctaBuffer.toString('base64'),
    path: ctaFilepath
  });
  console.log();

  // 3. Generate Caption
  console.log('  \x1b[36m[4/4]\x1b[0m Generating viral caption...');
  const caption = generateCaption(city, items.length, code, mockItinerary, 'topPlaces');

  console.log('  \x1b[36mComplete!\x1b[0m');
  
  return { generatedFiles, caption };
}
