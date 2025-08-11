import type { JobID } from './job-id.js';

export interface CreateEncryptionStreamParameters {
  /** Job ID */
  id: JobID;
  /** A readable stream of plaintext data */
  readableStream: ReadableStream;
  /** The content length of the file, in bytes */
  contentLength: number | null;
  /** Encryption key */
  key: Uint8Array;
  /** Encryption IV */
  iv: Uint8Array;
}

export interface CreateDecryptionStreamParameters
  extends CreateEncryptionStreamParameters {
  /** Authentication tag */
  authTag: Uint8Array;
  /** Dangerously bypass authTag validation. Only use this for testing purposes. */
  ignoreAuthTag?: boolean;
}

export interface EncryptParameters {
  /** Encryption key */
  key: Uint8Array;
  /** Encryption IV */
  iv: Uint8Array;
  /** Job ID */
  jobID: JobID;
  /** The content length of the file, in bytes */
  contentLength: number | null;
  /** Readable port */
  readablePort: MessagePort;
  /** Writable port */
  writablePort: MessagePort;
}

export interface DecryptParameters extends EncryptParameters {
  /** Authentication tag */
  authTag: Uint8Array;
}
