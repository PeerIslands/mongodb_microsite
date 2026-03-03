/**
 * Azure Block Blob chunked upload (Put Block + Put Block List).
 * Uploads from frontend → Azure directly using SAS token. No backend memory.
 * Supports configurable chunk size and concurrency for production (1GB+ uploads).
 *
 * Performance tuning:
 * - Chunk size: 4MB (safe), 8MB (balance), 16MB (fast broadband), 32MB (enterprise).
 * - Concurrency: 3–5 stable, 6–8 faster, 10+ only with strong bandwidth.
 * - Avoid large blocks + high concurrency = browser memory spike.
 */

/** Chunk size presets (bytes) for tuning. Azure block max is 100MB. */
export const CHUNK_SIZE_PRESETS = {
  /** Safe default */
  '4MB': 4 * 1024 * 1024,
  /** Good balance */
  '8MB': 8 * 1024 * 1024,
  /** Fast broadband */
  '16MB': 16 * 1024 * 1024,
  /** High-speed enterprise */
  '32MB': 32 * 1024 * 1024,
} as const;

export type ChunkSizePreset = keyof typeof CHUNK_SIZE_PRESETS;

/** Default chunk size (4MB). */
const DEFAULT_CHUNK_SIZE = CHUNK_SIZE_PRESETS['4MB'];

/** Default concurrency (stable). */
const DEFAULT_CONCURRENCY = 4;

/** Max concurrency to avoid memory spikes (chunkSize × concurrency ≈ in-flight memory). */
const MAX_CONCURRENCY = 12;

export interface AzureChunkedUploadOptions {
  /**
   * Chunk size in bytes. Use CHUNK_SIZE_PRESETS or custom (≤ 100MB).
   * 4MB = safe, 8MB = balance, 16MB = fast, 32MB = enterprise.
   */
  chunkSizeBytes?: number;
  /**
   * Max concurrent Put Block requests. 3–5 stable, 6–8 faster, 10+ only if strong bandwidth.
   * Capped at MAX_CONCURRENCY to limit memory (chunkSize × concurrency).
   */
  concurrency?: number;
}

/**
 * Generate a fixed-length base64 block ID for Azure (all IDs must be same length).
 */
function getBlockId(index: number): string {
  const s = String(index).padStart(6, '0');
  return btoa(s);
}

/**
 * Run up to `concurrency` tasks at a time.
 */
async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  let index = 0;
  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++;
      await fn(items[i], i);
    }
  }
  const workers = Math.min(concurrency, items.length, MAX_CONCURRENCY);
  await Promise.all(Array.from({ length: workers }, () => worker()));
}

/**
 * Upload a file to Azure Blob Storage in chunks (Put Block + Put Block List).
 * Frontend → Azure directly using SAS URL; no backend proxy.
 *
 * @param uploadUrl - Full blob URL with SAS (from backend GET .../upload-url)
 * @param file - File to upload
 * @param onProgress - Called with 0–100 progress
 * @param contentType - Optional content type (default video/mp4)
 * @param options - Optional chunk size and concurrency for tuning
 */
export async function uploadChunkedToAzure(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
  contentType: string = 'video/mp4',
  options?: AzureChunkedUploadOptions
): Promise<void> {
  const chunkSize = Math.min(
    Math.max(options?.chunkSizeBytes ?? DEFAULT_CHUNK_SIZE, 1024 * 1024),
    100 * 1024 * 1024
  ); // 1MB–100MB
  const concurrency = Math.min(
    Math.max(options?.concurrency ?? DEFAULT_CONCURRENCY, 1),
    MAX_CONCURRENCY
  );

  const totalSize = file.size;
  const numChunks = Math.ceil(totalSize / chunkSize);
  const blockIds: string[] = new Array(numChunks);
  const separator = uploadUrl.includes('?') ? '&' : '?';

  let completed = 0;
  const reportProgress = () => {
    const percent = numChunks ? Math.round((completed / numChunks) * 100) : 0;
    onProgress?.(Math.min(percent, 99));
  };

  const chunkIndices = Array.from({ length: numChunks }, (_, i) => i);

  await runWithConcurrency(chunkIndices, concurrency, async (i) => {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalSize);
    const chunk = file.slice(start, end);
    const blockId = getBlockId(i);
    blockIds[i] = blockId;

    const blockUrl = `${uploadUrl}${separator}comp=block&blockid=${encodeURIComponent(blockId)}`;

    const response = await fetch(blockUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(chunk.size),
        'x-ms-blob-type': 'BlockBlob',
        'x-ms-version': '2020-10-02',
      },
      body: chunk,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Put Block failed (${response.status}): ${text}`);
    }

    completed += 1;
    reportProgress();
  });

  // Commit block list (order must match block order in blob)
  const blockListXml = `<?xml version="1.0" encoding="utf-8"?><BlockList>${blockIds
    .map((id) => `<Latest>${id}</Latest>`)
    .join('')}</BlockList>`;

  const blockListUrl = `${uploadUrl}${separator}comp=blocklist`;

  const listResponse = await fetch(blockListUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/xml',
      'x-ms-blob-content-type': contentType,
      'x-ms-version': '2020-10-02',
    },
    body: blockListXml,
  });

  if (!listResponse.ok) {
    const text = await listResponse.text();
    throw new Error(`Put Block List failed (${listResponse.status}): ${text}`);
  }

  onProgress?.(100);
}
