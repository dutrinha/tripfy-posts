import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GlobalFonts } from '@napi-rs/canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves font file path, checking multiple possible locations
 * (process.cwd()-based and __dirname-based) for serverless compatibility.
 */
function resolveFontPath(filename) {
  const candidates = [
    path.join(process.cwd(), 'assets', filename),
    path.join(__dirname, '..', 'assets', filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

try {
  // Statically analyzable read calls for Vercel Node File Trace (NFT).
  // These MUST contain the path.join(__dirname, ...) structure with literal strings
  // so the `@vercel/nft` bundler traces and includes the font files.
  try {
    fs.readFileSync(path.join(__dirname, '..', 'assets', 'Inter-Regular.ttf'));
    fs.readFileSync(path.join(__dirname, '..', 'assets', 'Inter-Bold.ttf'));
  } catch (e) {
    // Suppress errors from dummy reads during trace static-analysis
  }

  const regularPath = resolveFontPath('Inter-Regular.ttf');
  const boldPath = resolveFontPath('Inter-Bold.ttf');

  // Register Regular weight
  if (regularPath) {
    const buf = fs.readFileSync(regularPath);
    const result = GlobalFonts.register(buf, 'Inter');
    if (result) {
      console.log(`✅ Registered Inter Regular from: ${regularPath} (${buf.length} bytes)`);
    } else {
      // Fallback to path-based registration
      GlobalFonts.registerFromPath(regularPath, 'Inter');
      console.log(`✅ Registered Inter Regular via path: ${regularPath}`);
    }
  } else {
    console.warn('⚠️ Warning: Inter-Regular.ttf not found in any location');
  }

  // Register Bold weight
  if (boldPath) {
    const buf = fs.readFileSync(boldPath);
    const result = GlobalFonts.register(buf, 'Inter');
    if (result) {
      console.log(`✅ Registered Inter Bold from: ${boldPath} (${buf.length} bytes)`);
    } else {
      GlobalFonts.registerFromPath(boldPath, 'Inter');
      console.log(`✅ Registered Inter Bold via path: ${boldPath}`);
    }
  } else {
    console.warn('⚠️ Warning: Inter-Bold.ttf not found in any location');
  }

  // Also load any fonts from the assets directory as a belt-and-suspenders fallback
  const assetsDir = regularPath ? path.dirname(regularPath) : path.join(__dirname, '..', 'assets');
  if (fs.existsSync(assetsDir)) {
    GlobalFonts.loadFontsFromDir(assetsDir);
    console.log(`✅ Also ran loadFontsFromDir on: ${assetsDir}`);
  }

  // Final verification
  const hasInter = GlobalFonts.has('Inter');
  console.log(`🔍 Font verification — Inter registered: ${hasInter}`);
  if (!hasInter) {
    console.error('❌ CRITICAL: Inter font is NOT registered. Text will be invisible on serverless environments without system fonts.');
  }
} catch (e) {
  console.error('❌ Failed to register custom fonts:', e.message);
  console.error(e.stack);
}
