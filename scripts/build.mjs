// Copies the deployable files into dist/. dist/ is generated: edit the root files, then run `npm run build`.
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');
const files = ['index.html', '404.html', 'robots.txt', 'app.js', 'styles.css'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const file of files) cpSync(join(root, file), join(out, file));
console.log(`Built ${files.length} files into dist/`);
