const ORIGIN_MATCHER = /^[\w-]+:\/{2,}\[?[\w.:-]+\]?(?::[0-9]*)?/;

/**
 * Gets the origin from a URL
 *
 * @memberof module:utils
 * @param url - The URL to extract an origin from
 * @returns The origin of the URL
 */
export function extractOrigin(url: string): string {
  const origin = url.match(ORIGIN_MATCHER);
  if (!origin) {
    throw new Error('No origin found. Possibly invalid URL');
  }
  return origin[0];
}

/**
 * Gets the unique set of origins from a list of URLs
 *
 * @memberof module:utils
 * @param urls - The list of urls to extract the origins from
 * @returns The unique set of origins for this URLs
 */
export default function getOrigins(...urls: string[]): string[] {
  return [...new Set<string>(urls.map(extractOrigin))];
}
