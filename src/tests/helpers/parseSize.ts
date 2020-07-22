const units = {
  KB: 1e3,
  MB: 1e6,
  GB: 1e9,
};

/**
 * Parses human-readable file sizes with MB or GB units
 * @param size - Size string
 * @returns Size in bytes
 */
export default function parseSize(size: string): number {
  const byteSize = size
    .trim()
    .split(/\s+/)
    .map((key) => {
      const unit = key as keyof typeof units;
      return unit in units ? units[unit] : +key;
    })
    .reduce((acc, val) => acc * val);
  return byteSize;
}
