import { PenumbraDecryptionInfo, PenumbraEncryptedFile, PenumbraEncryptionOptions, PenumbraFile, PenumbraTextOrURI, RemoteResource } from './types';
import { setWorkerLocation } from './workers';
import { supported } from './ua-support';
import { saveZip } from './zip';
/**
 * penumbra.get() API
 *
 * ```ts
 * // Load a resource and get a ReadableStream
 * await penumbra.get(resource);
 *
 * // Buffer all responses & read them as text
 * await Promise.all((await penumbra.get(resources)).map(({ stream }) =>
 *  new Response(stream).text()
 * ));
 *
 * // Buffer a response & read as text
 * await new Response((await penumbra.get(resource))[0].stream).text();
 *
 * // Example call with an included resource
 * await penumbra.get({
 *   url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
 *   filePrefix: 'NYT',
 *   mimetype: 'text/plain',
 *   decryptionOptions: {
 *     key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
 *     iv: '6lNU+2vxJw6SFgse',
 *     authTag: 'gadZhS1QozjEmfmHLblzbg==',
 *   },
 * });
 * ```
 */
export declare function get(...resources: RemoteResource[]): Promise<PenumbraFile[]>;
/**
 * Save files retrieved by Penumbra
 *
 * @param data - The data files to save
 * @param fileName - The name of the file to save to
 * @returns AbortController
 */
declare function save(files: PenumbraFile[], fileName?: string, controller?: AbortController): AbortController;
/**
 * Load files retrieved by Penumbra into memory as a Blob
 *
 * @param data - The data to load
 * @returns A blob of the data
 */
declare function getBlob(files: PenumbraFile[] | PenumbraFile | ReadableStream, type?: string): Promise<Blob>;
/**
 * Get the decryption config for an encrypted file
 *
 * ```ts
 * penumbra.getDecryptionInfo(file: PenumbraEncryptedFile): Promise<PenumbraDecryptionInfo>
 * ```
 */
export declare function getDecryptionInfo(file: PenumbraEncryptedFile): Promise<PenumbraDecryptionInfo>;
/**
 * penumbra.encrypt() API
 *
 * ```ts
 * await penumbra.encrypt(options, ...files);
 * // usage example:
 * size = 4096 * 64 * 64;
 * addEventListener('penumbra-progress',(e)=>console.log(e.type, e.detail));
 * addEventListener('penumbra-complete',(e)=>console.log(e.type, e.detail));
 * file = penumbra.encrypt(null, {stream:intoStream(new Uint8Array(size)), size});
 * let data = [];
 * file.then(async ([encrypted]) => {
 *   console.log('encryption started');
 *   data.push(new Uint8Array(await new Response(encrypted.stream).arrayBuffer()));
 * });
 * ```
 */
export declare function encrypt(options: PenumbraEncryptionOptions | null, ...files: PenumbraFile[]): Promise<PenumbraEncryptedFile[]>;
/**
 * penumbra.decrypt() API
 *
 * Decrypts files encrypted by penumbra.encrypt()
 *
 * ```ts
 * await penumbra.decrypt(options, ...files);
 * // usage example:
 * size = 4096 * 64 * 64;
 * addEventListener('penumbra-progress',(e)=>console.log(e.type, e.detail));
 * addEventListener('penumbra-complete',(e)=>console.log(e.type, e.detail));
 * file = penumbra.encrypt(null, {stream:intoStream(new Uint8Array(size)), size});
 * let data = [];
 * file.then(async ([encrypted]) => {
 *   console.log('encryption started');
 *   data.push(new Uint8Array(await new Response(encrypted.stream).arrayBuffer()));
 * });
 */
export declare function decrypt(options: PenumbraDecryptionInfo, ...files: PenumbraEncryptedFile[]): Promise<PenumbraFile[]>;
/**
 * Get file text (if content is viewable) or URI (if content is not viewable)
 *
 * @param files - A list of files to get the text of
 * @returns A list with the text itself or a URI encoding the file if applicable
 */
declare function getTextOrURI(files: PenumbraFile[]): Promise<PenumbraTextOrURI>[];
declare const penumbra: {
    get: typeof get;
    encrypt: typeof encrypt;
    decrypt: typeof decrypt;
    getDecryptionInfo: typeof getDecryptionInfo;
    save: typeof save;
    supported: typeof supported;
    getBlob: typeof getBlob;
    getTextOrURI: typeof getTextOrURI;
    saveZip: typeof saveZip;
    setWorkerLocation: typeof setWorkerLocation;
};
export default penumbra;
//# sourceMappingURL=API.d.ts.map