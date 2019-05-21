export interface FileOptions {
  fileName?: string,
  mime?: string,
}

export function downloadEncryptedFile(
  url: string | Buffer,
  key: string | Buffer,
  iv: string | Buffer,
  authTag: string | Buffer,
  mime: string,
): Promise<void>

export function getDecryptedContent(
  url: string | Buffer,
  key: string | Buffer,
  iv: string | Buffer,
  authTag: string | Buffer,
  options: FileOptions,
): Promise<string>
