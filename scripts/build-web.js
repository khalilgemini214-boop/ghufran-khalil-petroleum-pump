/* Builds the static web app into www/ and stamps the build id.
   The root index.html is the single source of truth. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'www');
const build = process.env.BUILD_ID || 'local-' + new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

function copy(name) {
  const src = path.join(root, name);
  if (!fs.existsSync(src)) return;
  let content = fs.readFileSync(src, 'utf8');
  content = content.replace(/__BUILD__/g, build);
  fs.writeFileSync(path.join(out, name), content);
}

['index.html', 'sw.js', 'offline.html', 'manifest.webmanifest'].forEach(copy);
['icon-192.png', 'icon-512.png', 'icon-1024.png', 'apple-touch-icon.png'].forEach((name) => {
  const src = path.join(root, 'assets', name);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(out, name));
});

fs.writeFileSync(
  path.join(out, 'version.json'),
  JSON.stringify({ build, builtAt: new Date().toISOString() }, null, 2) + '\n'
);

console.log('Built www/ with build id: ' + build);
