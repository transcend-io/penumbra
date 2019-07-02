import * as Comlink from 'comlink';
import { getDecryptedContent, downloadEncryptedFile } from '../dist/index';

const myValue = 43;
class PenumbraSW {
  getDecryptedContent(...args) {
    return getDecryptedContent(...args);
  }

  downloadEncryptedFile(...args) {
    return downloadEncryptedFile(...args);
  }

  logSomething() {
    console.log(`my value = ${myValue}`);
  }
}

Comlink.expose(PenumbraSW);
