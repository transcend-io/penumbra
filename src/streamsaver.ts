import streamSaver from 'streamsaver';
import { settings } from './settings';

streamSaver.mitm =
  settings.streamsaverEndpoint || 'https://streaming.transcend.io/mitm.html';

export { streamSaver };
