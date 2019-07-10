// local
import fetchAndDecrypt from './fetchAndDecrypt';
import { RemoteResource } from './types';
import { getOrigins } from './utils';

/**
 * Types of rels that a link can take on
 */
export type LinkRel = 'preconnect' | 'preload';

/**
 * A function that will clenaup all resource hints
 */
export type CleanupResourceHints = () => void;

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
  const links = urls.map((href) => {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    document.head.appendChild(link);
    return link;
  });
  return () => links.map((link) => link.remove());
}

/**
 * Initialize and open connections to origins that
 * will soon be requested to speed up connection setup.
 * This should speed up HTTP/2 connections, but not HTTP/1.1.
 *
 * @param origins - Origins of the files to pre-connect to
 * @returns A function removing the links that were appended to the DOM
 */
export function preconnect(...resources: RemoteResource[]): () => void {
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
 * Fetch multiple resources to be zipped. Annotates a RemoteResource list with fetch responses.
 *
 * ```ts
 * fetchMany(...resources).then((results) => zipAll(results, resources))
 * ```
 *
 * @param resources - The remote files to download
 * @returns Readable streams of the decrypted files
 */
export default async function fetchMany(
  ...resources: RemoteResource[]
): Promise<ReadableStream[]> {
  const cleanup = preconnect(...resources);
  const results = await Promise.all(resources.map(fetchAndDecrypt));
  cleanup();
  return results;
}
