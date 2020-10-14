/**
 * Promise.allSettled shim definitions
 */
declare module 'promise.allsettled' {
  export default Promise.allSettled;
  export function shim(): void;
}
