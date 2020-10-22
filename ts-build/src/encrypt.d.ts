/// <reference types="node" />
import { CipherGCM } from 'crypto';
import { Readable } from 'stream';
import { PenumbraEncryptedFile, PenumbraEncryptionOptions, PenumbraFileWithID } from './types';
/**
 * Encrypts a readable stream
 *
 * @param rs - A readable stream of encrypted data
 * @param cipher - The crypto module's cipher
 * @param contentLength - The content length of the file, in bytes
 * @param url - The URL to read the encrypted file from (only used for the event emitter)
 * @returns A readable stream of decrypted data
 */
export declare function encryptStream(jobID: number, rs: ReadableStream | Readable, cipher: CipherGCM, contentLength: number, key: Buffer, iv: Buffer): ReadableStream;
/** Encrypt a buffer */
export declare function encryptBuffer(): ArrayBuffer;
/**
 * Encrypts a file and returns a ReadableStream
 *
 * @param file - The remote resource to download
 * @returns A readable stream of the deciphered file
 */
export default function encrypt(options: PenumbraEncryptionOptions | null, file: PenumbraFileWithID, size: number): PenumbraEncryptedFile;
//# sourceMappingURL=encrypt.d.ts.map