/**
 * An object keyed by strings
 */
export declare type ObjByString = {
    [key in string]: any;
};
/**
 * Extract string keys from an object
 */
export declare type StringKeys<TObj extends ObjByString> = Extract<keyof TObj, string>;
/**
 * Object.keys for string keys only
 *
 * @param o - The object to get the keys from
 * @returns The string keys of the object preserving type
 */
export declare function getStringKeys<T extends {}>(o: T): StringKeys<T>[];
/**
 * Object.keys that actually preserves keys as types.
 *
 *
 * @memberof module:utils
 *
 * @param o - The object to get the keys from
 * @returns The keys of the object preserving type
 */
export default function getKeys<T extends {}>(o: T): (keyof T)[];
//# sourceMappingURL=getKeys.d.ts.map