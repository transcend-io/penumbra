import streamSaver from 'streamsaver';
import { settings } from './settings';
import { WritableStreamIsNative, WritableStreamPonyfill } from './streams';

streamSaver.mitm =
  settings.streamsaverEndpoint || 'https://streaming.transcend.io/mitm.html';

if (!WritableStreamIsNative) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (streamSaver as any).WritableStream = WritableStreamPonyfill;
}

export { streamSaver };
