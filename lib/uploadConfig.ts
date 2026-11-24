/**
 * Centralized upload size configuration for SmartERP frontend.
 *
 * Policy: Every individual file upload must be 5 MB or smaller.
 * This constant is shared across all upload components so that the
 * limit is enforced consistently from a single source of truth.
 *
 * 5 MiB = 5 * 1024 * 1024 = 5,242,880 bytes
 */

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

export const MAX_FILE_SIZE_LABEL = '5 MB';

export const FILE_SIZE_ERROR_MESSAGE =
  'File size exceeds the 5 MB limit. Please select a smaller file.';

/**
 * Returns true if the file is within the allowed size limit.
 */
export function isFileSizeValid(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Returns a human-readable file size string (e.g. "3.2 MB").
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
