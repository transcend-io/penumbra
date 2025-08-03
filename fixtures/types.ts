import type { RemoteResource } from '../src/types';

/**
 * A fixture is a remote resource with a checksum of the unencrypted file
 */
export interface Fixture extends RemoteResource {
  /** The checksum of the unencrypted file */
  unencryptedChecksum: string;
}
