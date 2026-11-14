import { createWorker } from 'tesseract.js';

/** Reads the selected image in a browser worker. All OCR assets are served by AstroMed. */
export async function readPhotoText(image: File, signal: AbortSignal) {
  signal.throwIfAborted();
  let abort: (() => void) | undefined;
  const canceled = new Promise<never>((_, reject) => {
    abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
  });
  const opening = createWorker('eng', 1, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr/core',
    langPath: '/ocr/lang',
    workerBlobURL: false,
    cacheMethod: 'none',
    errorHandler: () => {}, // The worker also rejects the pending recognition job.
  });
  try {
    const worker = await Promise.race([opening, canceled]);
    const { data } = await Promise.race([worker.recognize(image), canceled]);
    return data.text;
  } finally {
    if (abort) signal.removeEventListener('abort', abort);
    // Initialization cannot be interrupted through Tesseract's public API.
    void opening.then((worker) => worker.terminate()).catch(() => {});
  }
}
