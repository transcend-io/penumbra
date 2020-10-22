import { RemoteResource } from './types';
/**
 * Types of rels that a link can take on
 */
export declare type LinkRel = 'preconnect' | 'preload';
/**
 * A function that will cleanup all resource hints
 */
export declare type CleanupResourceHints = () => void;
/**
 * A helper function that creates a set resource hints
 *
 * @param urls - The urls to add the resource hint to
 * @returns A function removing the resource hints
 */
export declare function createResourceHintHelper(urls: string[], rel: LinkRel): CleanupResourceHints;
/**
 * Initialize and open connections to origins that
 * will soon be requested to speed up connection setup.
 * This should speed up HTTP/2 connections, but not HTTP/1.1.
 *
 * @param origins - Origins of the files to pre-connect to
 * @returns A function removing the links that were appended to the DOM
 */
export declare function preconnect(...resources: RemoteResource[]): () => void;
/**
 * Connect to and start loading URLs before they are needed.
 *
 * @param urls - The URLs to preload
 * @returns A function that removes the link tags that were appended to the DOM
 */
export declare function preload(...resources: RemoteResource[]): () => void;
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
export default function fetchMany(...resources: RemoteResource[]): Promise<ReadableStream[]>;
//# sourceMappingURL=fetchMany.d.ts.map