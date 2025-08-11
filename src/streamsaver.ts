import streamSaver from 'streamsaver/StreamSaver.js';

/**
 * Where to load the the service worker from. This file can be self-hosted
 * @see https://github.com/jimmywarting/StreamSaver.js/blob/5b372f7ba5f1e82ef80e2466023930ee2c616a28/mitm.html
 */
export type StreamSaverEndpoint =
  | 'streamsaver-default'
  | `http${string}`
  | `/${string}`;

class StreamSaverInstance {
  constructor(
    /**
     * Where to load the the service worker from. This file can be self-hosted
     * @see https://github.com/jimmywarting/StreamSaver.js/blob/5b372f7ba5f1e82ef80e2466023930ee2c616a28/mitm.html
     */
    endpoint: StreamSaverEndpoint,
  ) {
    if (endpoint !== 'streamsaver-default') {
      /** The HTML file for the service worker that sets up the local download stream */
      streamSaver.mitm = endpoint;
    }
  }

  public streamSaver = streamSaver;
}

export { StreamSaverInstance };
