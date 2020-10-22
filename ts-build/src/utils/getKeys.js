"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Object.keys for string keys only
 *
 * @param o - The object to get the keys from
 * @returns The string keys of the object preserving type
 */
function getStringKeys(o) {
    return Object.keys(o).filter((k) => typeof k === 'string');
}
exports.getStringKeys = getStringKeys;
/**
 * Object.keys that actually preserves keys as types.
 *
 *
 * @memberof module:utils
 *
 * @param o - The object to get the keys from
 * @returns The keys of the object preserving type
 */
function getKeys(o) {
    return Object.keys(o);
}
exports.default = getKeys;
//# sourceMappingURL=getKeys.js.map