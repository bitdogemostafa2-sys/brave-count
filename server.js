/**
 * BraveCount Pro v3.0 — Preview & Extension Package Server
 * Binds to 0.0.0.0:3000 so the user can test the 300-technique interactive simulator
 * and download the ready-to-install Brave Extension (.zip).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// Build zip package via Python zipfile module (zero external dependencies)
function buildExtensionZip() {
  const pyScript = `
import zipfile, os

root_dir = ${JSON.stringify(ROOT)}
zip_path = os.path.join(root_dir, "brave-count-pro-v3.zip")
include_items = ["manifest.json", "assets", "src", "README.md"]

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for item in include_items:
        full_p = os.path.join(root_dir, item)
        if os.path.isfile(full_p):
            zf.write(full_p, item)
        elif os.path.isdir(full_p):
            for root, dirs, files in os.walk(full_p):
                for f in files:
                    abs_f = os.path.join(root, f)
                    rel_f = os.path.relpath(abs_f, root_dir)
                    zf.write(abs_f, rel_f)
`;
  try {
    const res = spawnSync('python3', ['-c', pyScript], { encoding: 'utf8' });
    if (res.status === 0) {
      console.log('[BraveCount Pro] Extension package brave-count-pro-v3.zip ready.');
    } else {
      console.error('[BraveCount Pro] Zip generation error:', res.stderr);
    }
  } catch (err) {
    console.error('[BraveCount Pro] Zip generation warning:', err.message);
  }
}

buildExtensionZip();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let urlPath = (req.url || '/').split('?')[0];
  if (urlPath === '/' || urlPath === '/index.html') {
    urlPath = '/src/dashboard/index.html';
  }

  const safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = { 'Content-Type': contentType };
    if (ext === '.zip') {
      headers['Content-Disposition'] = 'attachment; filename="brave-count-pro-v3.zip"';
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`BraveCount Pro v3.0 Dashboard & Simulator listening on http://0.0.0.0:${PORT}`);
});
