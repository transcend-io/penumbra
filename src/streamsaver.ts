import * as streamSaver from 'streamsaver';
import { settings } from './settings';

// @ts-expect-error - streamsaver is not typed
streamSaver.mitm =
  settings.streamsaverEndpoint || 'https://streaming.transcend.io/mitm.html';

export { streamSaver };
