import { PenumbraSupportLevel } from './enums';

/** Whether WritableStream and TransformStream are natively supported */
export const advancedStreamsSupported =
  'WritableStream' in self && 'TransformStream' in self;
let supportLevel: PenumbraSupportLevel = PenumbraSupportLevel.none;

// Event/CustomEvent is non-instantiable, among many various other incompatibilities in IE11
if (
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  self.dispatchEvent &&
  typeof self.CustomEvent === 'function' &&
  typeof self.Proxy === 'function' &&
  typeof self.Promise === 'function' &&
  typeof self.Response === 'function' &&
  typeof self.fetch === 'function'
) {
  supportLevel = advancedStreamsSupported
    ? PenumbraSupportLevel.full
    : PenumbraSupportLevel.size_limited;
}

/**
 * Get Penumbra user agent support level
 *
 * @returns Support level
 */
export function supported(): PenumbraSupportLevel {
  return supportLevel;
}

supported.levels = PenumbraSupportLevel;
