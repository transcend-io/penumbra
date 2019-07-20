/**
 * spreadify: add a universal iterator to any array-like object.
 *
 * @example
 * const list = [...{...nonIterableArrayLike, ...spreadify}];
 * for (const item of list) {
 *   item.doStuff();
 * }
 */
const spreadify = {
  /** General array-like iterator */
  *[Symbol.iterator](): any {
    const iterator = this[Symbol.iterator];
    delete this[Symbol.iterator];
    // eslint-disable-next-line no-restricted-syntax
    for (const item of Array.from(this)) {
      yield item;
    }
    this[Symbol.iterator] = iterator;
  },
};

export default spreadify;

// /** Alternative spreadify implementation with `...spreadify.once` */
// const spreadify = {
//   /** Always spread */
//   *[Symbol.iterator](): any {
//     delete this[Symbol.iterator];
//     yield* this.once[Symbol.iterator].call(this);
//     this[Symbol.iterator] = this.once[Symbol.iterator];
//   },
//   once: {
//     /** Spread once */
//     *[Symbol.iterator](): any {
//       delete this[Symbol.iterator];
//       // eslint-disable-next-line no-restricted-syntax
//       for (const item of Array.from(this)) {
//         yield item;
//       }
//     },
//   },
// };
