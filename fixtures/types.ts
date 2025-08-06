/**
 * A fixture is a remote resource with a checksum of the unencrypted file
 */
export interface Fixture {
  url: string;
  filePrefix: string;
  mimetype: string | undefined;
  size?: number;
  decryptionOptions: {
    key: string;
    iv: string;
    authTag: string;
  };
  /** The checksum of the unencrypted file */
  unencryptedChecksum: string;
}
