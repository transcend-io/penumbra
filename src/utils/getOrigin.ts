const ORIGIN_MATCHER = /^[\w-]+:\/{2,}\[?[\w.:-]+\]?(?::[0-9]*)?/;

/**
 * Gets the origin from a URL
 *
 * @memberof module:utils
 *
 * @param url - The URL to extract an origin from
 * @returns The origin of the URL
 */
export default function getOrigin(url: string): string {
  const origin = url.match(ORIGIN_MATCHER);
  if (!origin) {
    throw new Error('No origin found. Possible invalid URL');
  }
  return origin[0];
}
