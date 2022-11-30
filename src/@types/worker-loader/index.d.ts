/** Webpack worker-loader type setup */
declare module 'web-worker:*' {
  /** Worker */
  class PenumbraWebWorker extends Worker {}
  export default PenumbraWebWorker;
}
