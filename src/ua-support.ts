import { PenumbraSupportLevel } from './enums';

let supportLevel: PenumbraSupportLevel = PenumbraSupportLevel.none;

// Event/CustomEvent is non-instantiable, among many various other incompatibilities in IE11
if (
  self.dispatchEvent &&
  typeof self.CustomEvent === 'function' &&
  typeof self.Proxy === 'function' &&
  typeof self.Promise === 'function' &&
  typeof self.Response === 'function' &&
  typeof self.fetch === 'function'
) {
  supportLevel =
    'WritableStream' in self && 'TransformStream' in self
      ? PenumbraSupportLevel.full
      : PenumbraSupportLevel.size_limited;
}

/** Get Penumbra user agent support level */
export function supported(): PenumbraSupportLevel {
  return supportLevel;
}

supported.levels = PenumbraSupportLevel;
