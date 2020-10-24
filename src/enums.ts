/** Compression levels */
export enum Compression {
  /** No compression */
  Store = 0,
  /** Low compression */
  Low = 1,
  /** Medium compression */
  Medium = 2,
  /** High compression */
  High = 3,
}

/** Penumbra user agent support level */
export enum PenumbraSupportLevel {
  /** Old browser where Penumbra does not work at all */
  none = -0,
  /** Modern browser where Penumbra is not yet supported */
  possible = 0,
  /** Modern browser where file size limit is low */
  size_limited = 1,
  /** Modern browser with full support */
  full = 2,
}
