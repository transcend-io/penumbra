const TEXT_TYPES =
  /^\s*(?:text\/[^/\s]+|application\/(?:xml|json)|[^/\s]+\/[^/\s]+\+(?:xml|json))\s*(?:$|;)/i;

// const codecTester = document.createElementNS(
//   'http://www.w3.org/1999/xhtml',
//   'video',
// ) as HTMLMediaElement;

/**
 * Determine if the file mimetype is known for displaying
 * @param mimetype - Mimetype
 * @returns 'probably', 'maybe', or '' depending on if mime type can be displayed
 */
export default function isViewableText(mimetype: string): boolean {
  if (typeof mimetype !== 'string') {
    return false;
  }
  const type = mimetype.split('/')[0].trim().toLowerCase();
  return type === 'text' || TEXT_TYPES.test(mimetype);
}
