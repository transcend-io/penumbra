/** Webpack worker-loader type setup */
declare module 'worker-loader!*' {
  /** Worker */
  class WebpackWorker extends Worker {
    /** Webpack's Worker constructor */
    public constructor();
  }

  export default WebpackWorker;
}
