"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TEXT_TYPES = /^\s*(?:text\/\S*|application\/(?:xml|json)|\S*\/\S*\+xml|\S*\/\S*\+json)\s*(?:$|;)/i;
// const codecTester = document.createElementNS(
//   'http://www.w3.org/1999/xhtml',
//   'video',
// ) as HTMLMediaElement;
/**
 * Determine if the file mimetype is known for displaying
 *
 * @returns 'probably', 'maybe', or '' depending on if mime type can be displayed
 */
function isViewableText(mimetype) {
    const type = mimetype
        .split('/')[0]
        .trim()
        .toLowerCase();
    return type === 'text' || TEXT_TYPES.test(mimetype);
}
exports.default = isViewableText;
//# sourceMappingURL=isViewableText.js.map