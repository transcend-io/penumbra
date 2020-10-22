/// <reference types="node" />
import { DecipherGCM } from 'crypto';
import { PenumbraDecryptionInfo, PenumbraEncryptedFile, PenumbraFile } from './types';
/**
 * Decrypts a readable stream
 *
 * @param rs - A readable stream of encrypted data
 * @param decipher - The crypto module's decipher
 * @param contentLength - The content length of the file, in bytes
 * @param id - The ID number (for arbitrary decryption) or URL to read the encrypted file from (only used for the event emitter)
 * @returns A readable stream of decrypted data
 */
export default function decryptStream(rs: ReadableStream, decipher: DecipherGCM, contentLength: number, id: string | number): ReadableStream;
/**
 * Decrypts a file and returns a ReadableStream
 *
 * @param file - The remote resource to download
 * @returns A readable stream of the deciphered file
 */
export declare function decrypt(options: PenumbraDecryptionInfo, file: PenumbraEncryptedFile, size: number): PenumbraFile;
//# sourceMappingURL=decrypt.d.ts.map