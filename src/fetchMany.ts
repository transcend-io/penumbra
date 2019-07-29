// local
import fetchAndDecrypt from './fetchAndDecrypt';
import { RemoteResource, RemoteResourceWithoutFile } from './types';
import { getOrigins } from './utils';

/**
 * Types of rels that a link can take on
 */
export type LinkRel = 'preconnect' | 'preload';

/**
 * A function that will cleanup all resource hints
 */
export type CleanupResourceHints = () => void;

/** No-op function generator */
// tslint:disable-next-line: no-empty
const nooper = (): CleanupResourceHints => (): void => {};

/**
 * A helper function that creates a set resource hints
 *
 * @param urls - The urls to add the resource hint to
 * @returns A function removing the resource hints
 */
export function createResourceHintHelper(
  urls: string[],
  rel: LinkRel,
): CleanupResourceHints {
  if (self.document) {
    const links = urls.map((href) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => links.map((link) => link.remove());
  }

  return nooper();
}

/**
 * Initialize and open connections to origins that
 * will soon be requested to speed up connection setup.
 * This should speed up HTTP/2 connections, but not HTTP/1.1.
 *
 * @param origins - Origins of the files to pre-connect to
 * @returns A function removing the links that were appended to the DOM
 */
export function preconnect(
  ...resources: RemoteResourceWithoutFile[]
): () => void {
  // preconnect to the origins
  const origins = getOrigins(...resources.map((resource) => resource.url));
  return createResourceHintHelper(origins, 'preconnect');
}

/**
 * Connect to and start loading URLs before they are needed.
 *
 * @param urls - The URLs to preload
 * @returns A function that removes the link tags that were appended to the DOM
 */
export function preload(...resources: RemoteResource[]): () => void {
  return createResourceHintHelper(
    resources.map((resource) => resource.url),
    'preload',
  );
}

/**
 * Fetch multiple resources to be zipped. Returns a list of ReadableStreams for each fetch request.
 *
 * ```ts
 * fetchMany(...resources).then((results) => zipAll(results, resources))
 * ```
 *
 * @param resources - The remote files to download
 * @returns Readable streams of the decrypted files
 */
export default async function fetchMany(
  ...resources: RemoteResourceWithoutFile[]
): Promise<ReadableStream[]> {
  const cleanup = preconnect(...resources);
  const results = await Promise.all(resources.map(fetchAndDecrypt));
  cleanup();
  return results;
}
