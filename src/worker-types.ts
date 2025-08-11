import type { JobID } from './job-id.js';

interface EncryptionJobBaseParameters {
  /** Job ID */
  jobID: JobID;
  /** The content length of the file, in bytes */
  contentLength: number | null;
  /** Encryption key */
  key: Uint8Array;
  /** Encryption IV */
  iv: Uint8Array;
}

interface DecryptionJobBaseParameters extends EncryptionJobBaseParameters {
  /** Authentication tag */
  authTag: Uint8Array;
}

export interface CreateEncryptionStreamParameters
  extends EncryptionJobBaseParameters {
  /** A readable stream of plaintext data */
  readableStream: ReadableStream;
}

export interface CreateDecryptionStreamParameters
  extends DecryptionJobBaseParameters {
  /** A readable stream of encrypted data */
  readableStream: ReadableStream;
  /** Dangerously bypass authTag validation. Only use this for testing purposes. */
  ignoreAuthTag?: boolean;
}

export interface EncryptParameters extends EncryptionJobBaseParameters {
  /** Readable port */
  readablePort: MessagePort;
  /** Writable port */
  writablePort: MessagePort;
}

export interface DecryptParameters extends DecryptionJobBaseParameters {
  /** Readable port */
  readablePort: MessagePort;
  /** Writable port */
  writablePort: MessagePort;
}
