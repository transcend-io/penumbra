/* eslint-disable class-methods-use-this */

import * as Comlink from 'comlink';
import { Decipher } from 'crypto';
import { decryptStream, getDecryptedContent } from '.';
import { RemoteResourceWithoutFile } from './types';

/**
 * Penumbra Worker class
 */
class PenumbraDecryptionWorker {
  /**
   * Get the contents of an encrypted file
   *
   * @param options - FetchDecryptedContentOptions
   * @returns The file contents
   */
  public getDecryptedContent(
    resource: RemoteResourceWithoutFile,
    alwaysResponse: boolean,
  ): Promise<string | Response> {
    return getDecryptedContent(resource, alwaysResponse);
  }

  /**
   * Get the contents of an encrypted file
   *
   * @param rs ReadableStream to decode
   * @param decipher Decipher instance
   * @param contentLength Content size
   * @param url URL being requested (for progress events, not fetched )
  progressEventName?: string,
   * @returns Decrypted ReadableStream
   */
  public decryptStream(
    rs: ReadableStream,
    decipher: Decipher,
    contentLength: number,
    url: string,
    progressEventName?: string,
  ): ReadableStream {
    return decryptStream(rs, decipher, contentLength, url, progressEventName);
  }
}

Comlink.expose(PenumbraDecryptionWorker);
