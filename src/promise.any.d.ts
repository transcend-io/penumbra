declare module 'promise.any' {
  global {
    interface PromiseConstructor {
      /** Promise.any */
      any: (<T>(iterable: Iterable<T | PromiseLike<T>>) => Promise<T>) & {
        shim?(): void;
      };
    }
  }
  export default Promise.any;
}
