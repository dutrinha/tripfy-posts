import fs from 'fs';
import http from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    http.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  try {
    console.log('Downloading Inter-Bold.ttf...');
    await downloadFile(
      'https://cdn.jsdelivr.net/gh/googlefonts/roboto/src/hinted/Roboto-Bold.ttf',
      path.join(assetsDir, 'Inter-Bold.ttf')
    );
    console.log('Inter-Bold.ttf downloaded.');

    console.log('Downloading Inter-Regular.ttf...');
    await downloadFile(
      'https://cdn.jsdelivr.net/gh/googlefonts/roboto/src/hinted/Roboto-Regular.ttf',
      path.join(assetsDir, 'Inter-Regular.ttf')
    );
    console.log('Inter-Regular.ttf downloaded.');
    console.log('Fonts download completed successfully!');
  } catch (err) {
    console.error('Error downloading fonts:', err);
  }
}

run();
