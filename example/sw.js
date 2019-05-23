import * as Comlink from 'comlink';

class Fetcher {
  logSomething() {
    console.log('hey! its me');
  }
}
Comlink.expose(Fetcher);