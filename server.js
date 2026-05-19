import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateCarousel } from './generate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Basic Authentication Middleware
import crypto from 'crypto';

const adminUser = process.env.ADMIN_USER;
const adminPass = process.env.ADMIN_PASSWORD;

app.use((req, res, next) => {
  if (!adminUser || !adminPass) {
    console.error('❌ Authentication failed: ADMIN_USER or ADMIN_PASSWORD is not configured in environment variables.');
    res.set('WWW-Authenticate', 'Basic realm="Protected Area"');
    return res.status(401).send('Authentication not configured on server.');
  }

  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  const expectedLogin = Buffer.from(adminUser);
  const expectedPass = Buffer.from(adminPass);
  const inputLogin = Buffer.from(login || '');
  const inputPass = Buffer.from(password || '');

  let loginMatch = false;
  let passMatch = false;

  try {
    if (expectedLogin.length === inputLogin.length) {
      loginMatch = crypto.timingSafeEqual(expectedLogin, inputLogin);
    }
    if (expectedPass.length === inputPass.length) {
      passMatch = crypto.timingSafeEqual(expectedPass, inputPass);
    }
  } catch (e) {
    // Catch potential errors gracefully
  }

  if (loginMatch && passMatch) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Protected Area"');
  res.status(401).send('Authentication required.');
});
app.use(express.static(path.join(__dirname, 'public')));
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET || process.env.SUPABASE_KEY || ''; // from .env
let supabase;

try {
  let validUrl = supabaseUrl;
  if (validUrl && !validUrl.startsWith('http')) {
    validUrl = `https://${validUrl}.supabase.co`;
  }
  if (validUrl) {
    supabase = createClient(validUrl, supabaseKey);
  }
} catch (e) {
  console.warn('⚠️ Warning: Could not initialize Supabase client. Please check SUPABASE_URL in .env');
}

app.get('/api/itinerary/:code', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client is not initialized. Please check your .env' });
    }
    const { code } = req.params;
    
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('share_code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Itinerary not found for this code' });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    console.error('Error fetching itinerary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/preview-image', async (req, res) => {
  try {
    const { name, city, id, dayNum, index } = req.query;
    if (!name) return res.status(400).send('Name required');
    
    // Dynamically import `fetchImageForLocation` to keep server clean
    // or we can import it at the top level
    const { fetchImageForLocation } = await import('./src/imageFetcher.js');
    
    const buf = await fetchImageForLocation(name, city || '', id || '', parseInt(dayNum) || 1, parseInt(index) || 0);
    
    if (buf) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(buf);
    } else {
      res.status(404).send('Not found');
    }
  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).send('Error');
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const { code, items, city } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items provided' });
    }

    console.log(`Starting generation for code ${code}...`);
    // Run the generation pipeline
    const result = await generateCarousel(items, code, city);
    
    res.json({ success: true, result });
  } catch (err) {
    console.error('Error generating carousel:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

// Export app for Vercel serverless functions, or run locally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log();
    console.log('  \x1b[36mTripfy Setup UI running on http://localhost:' + PORT + '\x1b[0m');
    console.log();
  });
}

export default app;
