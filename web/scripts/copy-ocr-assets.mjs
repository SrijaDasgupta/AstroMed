import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

const root = process.cwd();
const require = createRequire(join(root, 'package.json'));
const worker = require.resolve('tesseract.js/dist/worker.min.js');
const core = dirname(require.resolve('tesseract.js-core', { paths: [dirname(worker)] }));
const language = dirname(require.resolve('@tesseract.js-data/eng'));
const output = resolve(root, 'public/ocr');
await Promise.all([mkdir(join(output, 'core'), { recursive: true }), mkdir(join(output, 'lang'), { recursive: true })]);
const coreFiles = (await readdir(core)).filter((name) => name.endsWith('.wasm.js') || name.endsWith('.wasm'));
await Promise.all([
  copyFile(worker, join(output, 'worker.min.js')),
  copyFile(join(language, '4.0.0_best_int', 'eng.traineddata.gz'), join(output, 'lang', 'eng.traineddata.gz')),
  ...coreFiles.map((name) => copyFile(join(core, name), join(output, 'core', name))),
]);
console.log('Copied browser OCR assets to public/ocr.');
