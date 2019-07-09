// local
import fetchAndDecrypt from './fetchAndDecrypt';
import { RemoteResource } from './types';
import { getMediaSrcFromRS, getTextFromRS } from './utils';

const MEDIA_TYPES = ['image', 'video', 'audio'];
const TEXT_TYPES = /^\s*(?:text\/\S*|application\/(?:xml|json)|\S*\/\S*\+xml|\S*\/\S*\+json)\s*(?:$|;)/i;

/**
 * Get the contents of an encrypted file
 *
 * @param options - FetchDecryptedContentOptions
 * @returns The file contents
 */
export default async function getDecryptedContent(
  resource: RemoteResource,
  alwaysBlob = false,
): Promise<string | Blob> {
  // Fetch the resource
  const rs = await fetchAndDecrypt(resource);

  // Return the decrypted content
  const type = resource.mimetype
    .split('/')[0]
    .trim()
    .toLowerCase();
  if (!alwaysBlob) {
    if (MEDIA_TYPES.includes(type)) {
      return getMediaSrcFromRS(rs);
    }
    if (type === 'text' || TEXT_TYPES.test(resource.mimetype)) {
      return getTextFromRS(rs);
    }
  }

  // Always return a blob
  return new Response(rs).blob();
}
