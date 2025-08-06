import type { RemoteResource } from '../src/types';

/**
 * A fixture is a remote resource with a checksum of the unencrypted file
 */
export interface Fixture extends RemoteResource {
  url: string;
  filePrefix: string;
  mimetype: string;
  decryptionOptions: {
    key: string;
    iv: string;
    authTag: string;
  };
  /** The checksum of the unencrypted file */
  unencryptedChecksum: string;
}
