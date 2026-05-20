import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GlobalFonts } from '@napi-rs/canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const regularFont = path.join(__dirname, '..', 'assets', 'Inter-Regular.ttf');
  const boldFont = path.join(__dirname, '..', 'assets', 'Inter-Bold.ttf');

  // Statically analyzable read calls for Vercel Node File Trace (NFT).
  // These MUST contain the path.join(__dirname, ...) structure with literal strings
  // so the `@vercel/nft` bundler traces and includes the font files.
  try {
    fs.readFileSync(path.join(__dirname, '..', 'assets', 'Inter-Regular.ttf'));
    fs.readFileSync(path.join(__dirname, '..', 'assets', 'Inter-Bold.ttf'));
  } catch (e) {
    // Suppress errors from dummy reads during trace static-analysis
  }

  if (fs.existsSync(regularFont)) {
    GlobalFonts.registerFromPath(regularFont, 'Arial');
    console.log('✅ Registered font from path: Inter-Regular.ttf as Arial');
  } else {
    console.warn('⚠️ Warning: Regular font file not found:', regularFont);
  }

  if (fs.existsSync(boldFont)) {
    GlobalFonts.registerFromPath(boldFont, 'Arial');
    console.log('✅ Registered font from path: Inter-Bold.ttf as Arial');
  } else {
    console.warn('⚠️ Warning: Bold font file not found:', boldFont);
  }
} catch (e) {
  console.warn('⚠️ Warning: Failed to register custom fonts:', e.message);
}
