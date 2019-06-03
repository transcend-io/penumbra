/// <reference types="node" />
/**
 * Download, decrypt, and save a file
 * @param url the URL to fetch the encrypted file from
 * @param key a base64 encoded decryption key
 * @param iv a base64 encoded initialization vector
 * @param authTag a base64 encoded authentication tag (for AES GCM)
 * @param options mime, fileName
 * @returns
 */
declare type DownloadEncryptedFileOptions = {
    fileName?: string | null;
    progressEventName?: string;
};
export declare function downloadEncryptedFile(url: string, key: string | Buffer, iv: string | Buffer, authTag: string | Buffer, options?: DownloadEncryptedFileOptions): Promise<void>;
/**
 * Download, decrypt, and return string, object URL, or Blob to display directly on the webpage
 * @param url the URL to fetch an encrypted file from
 * @param key the decryption key to use for this encrypted file, as a Buffer or base64-encoded string
 * @param iv the initialization vector for this encrypted file, as a Buffer or base64-encoded string
 * @param authTag the authentication tag for this encrypted file, as a Buffer or base64-encoded string
 * @param mime the mime type of the underlying file
 * @returns depending on mime type, a string of text, or an src if it's media
 */
declare type GetDecryptedContentOptions = {
    alwaysBlob?: boolean;
    progressEventName?: string;
};
export declare function getDecryptedContent(url: string, key: string | Buffer, iv: string | Buffer, authTag: string | Buffer, mime: string, options?: GetDecryptedContentOptions): Promise<string | Blob>;
export {};
