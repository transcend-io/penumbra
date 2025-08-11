import type { JobID } from './job-id.js';

export interface EncryptionJobParameters {
  /** Job ID */
  jobID: JobID;
  /** The content length of the file, in bytes */
  contentLength: number | null;
  /** Encryption key */
  key: Uint8Array;
  /** Encryption IV */
  iv: Uint8Array;
}

export interface DecryptionJobParameters extends EncryptionJobParameters {
  /** Authentication tag */
  authTag: Uint8Array;
}

export interface CreateEncryptionStreamParameters
  extends EncryptionJobParameters {
  /** A readable stream of plaintext data */
  readableStream: ReadableStream;
}

export interface CreateDecryptionStreamParameters
  extends DecryptionJobParameters {
  /** A readable stream of encrypted data */
  readableStream: ReadableStream;
  /** Dangerously bypass authTag validation. Only use this for testing purposes. */
  ignoreAuthTag?: boolean;
}
