// local
import { RemoteResource } from './types';
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
const nooper = (): CleanupResourceHints => (): void => {};

/**
 * A helper function that creates a set resource hints
 *
 * @param urls - The urls to add the resource hint to
 * @param rel - Type of link rel that is being being hinted
 * @param fetch - Request resource as a cross-origin fetch
 * @returns A function removing the resource hints
 */
export function createResourceHintHelper(
  urls: string[],
  rel: LinkRel,
  fetch = false,
): CleanupResourceHints {
  if (self.document) {
    const links = urls.map((href) => {
      const link = document.createElement('link');
      link.rel = rel;
      if (fetch) {
        link.as = 'fetch';
        link.crossOrigin = 'use-credentials';
      }
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
 * @param resources
 * @returns A function removing the links that were appended to the DOM
 */
export function preconnect(...resources: RemoteResource[]): () => void {
  // preconnect to the origins
  const origins = getOrigins(...resources.map(({ url }) => url));
  return createResourceHintHelper(origins, 'preconnect');
}

/**
 * Connect to and start loading URLs before they are needed.
 *
 * @param urls - The URLs to preload
 * @param resources
 * @returns A function that removes the link tags that were appended to the DOM
 */
export function preload(...resources: RemoteResource[]): () => void {
  return createResourceHintHelper(
    resources.map(({ url }) => url),
    'preload',
    true,
  );
}
