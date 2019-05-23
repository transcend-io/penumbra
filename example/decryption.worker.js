import { getDecryptedContent } from '../dist/index';

import * as Comlink from 'comlink';

const myValue = 43;
class PenumbraSW {
  getDecryptedContent(...args) {
    return getDecryptedContent(...args);
  }

  logSomething() {
    console.log(`my value = ${myValue}`);
  }
}

Comlink.expose(PenumbraSW);