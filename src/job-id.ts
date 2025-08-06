import { type Brand, make } from './utils/brand';

/**
 * A unique identifier for a Penumbra job run.
 * Not to be confused with Worker ID, which identifies the Web Worker thread.
 */
export type JobID = Brand<
  `${string}-${string}-${string}-${string}-${string}`,
  'JobID'
>;

export const asJobID = make<JobID>((value) => {
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidV4Regex.test(value)) {
    throw new Error(`Invalid JobID: ${value}. Must be a valid UUIDv4 string.`);
  }
  return value;
});

/**
 * Generate a new JobID.
 * @returns A new JobID.
 */
export function generateJobID(): JobID {
  return asJobID(crypto.randomUUID());
}
