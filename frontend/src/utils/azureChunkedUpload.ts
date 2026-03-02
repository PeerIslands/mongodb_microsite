/**
 * Azure Block Blob chunked upload (Put Block + Put Block List).
 * Use for large files (e.g. 1GB+ video) - uploads in 4MB chunks directly to Azure.
 * No backend memory usage; progress can be reported per chunk.
 */

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB (Azure max block is 100MB)

/**
 * Generate a fixed-length base64 block ID for Azure (all IDs must be same length).
 * Uses 6-digit zero-padded index so pre-encoding length is consistent.
 */
function getBlockId(index: number): string {
  const s = String(index).padStart(6, '0');
  return btoa(s);
}

/**
 * Upload a file to Azure Blob Storage in chunks using Put Block + Put Block List.
 * @param uploadUrl - Full blob URL with SAS (from backend GET .../upload-url)
 * @param file - File to upload
 * @param onProgress - Called with 0-100 progress
 * @param contentType - Optional content type (default video/mp4)
 */
export async function uploadChunkedToAzure(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
  contentType: string = 'video/mp4'
): Promise<void> {
  const totalSize = file.size;
  const numChunks = Math.ceil(totalSize / CHUNK_SIZE);
  const blockIds: string[] = [];

  const separator = uploadUrl.includes('?') ? '&' : '?';

  for (let i = 0; i < numChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    const chunk = file.slice(start, end);
    const blockId = getBlockId(i);
    blockIds.push(blockId);

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

    const percent = Math.round(((i + 1) / numChunks) * 100);
    onProgress?.(Math.min(percent, 99));
  }

  // Commit block list
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
