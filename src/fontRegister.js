import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GlobalFonts } from '@napi-rs/canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Robust path resolution checking both process.cwd() and __dirname
  let regularFont = path.join(process.cwd(), 'assets', 'Inter-Regular.ttf');
  let boldFont = path.join(process.cwd(), 'assets', 'Inter-Bold.ttf');

  if (!fs.existsSync(regularFont)) {
    regularFont = path.join(__dirname, '..', 'assets', 'Inter-Regular.ttf');
  }
  if (!fs.existsSync(boldFont)) {
    boldFont = path.join(__dirname, '..', 'assets', 'Inter-Bold.ttf');
  }

  // Buffer-based registration with path-based fallback to guarantee compatibility on Vercel
  if (fs.existsSync(regularFont)) {
    try {
      global.interRegularFontBuffer = fs.readFileSync(regularFont);
      GlobalFonts.register(global.interRegularFontBuffer, 'Inter');
      console.log(`✅ Registered font buffer from: ${regularFont} as Inter`);
    } catch (bufferErr) {
      console.warn('⚠️ Buffer registration failed, falling back to path registration:', bufferErr.message);
      GlobalFonts.registerFromPath(regularFont, 'Inter');
      console.log(`✅ Registered font from path: ${regularFont} as Inter`);
    }
  } else {
    console.warn('⚠️ Warning: Regular font file not found:', regularFont);
  }

  if (fs.existsSync(boldFont)) {
    try {
      global.interBoldFontBuffer = fs.readFileSync(boldFont);
      GlobalFonts.register(global.interBoldFontBuffer, 'Inter');
      console.log(`✅ Registered font buffer from: ${boldFont} as Inter`);
    } catch (bufferErr) {
      console.warn('⚠️ Buffer registration failed, falling back to path registration:', bufferErr.message);
      GlobalFonts.registerFromPath(boldFont, 'Inter');
      console.log(`✅ Registered font from path: ${boldFont} as Inter`);
    }
  } else {
    console.warn('⚠️ Warning: Bold font file not found:', boldFont);
  }
} catch (e) {
  console.warn('⚠️ Warning: Failed to register custom fonts:', e.message);
}
