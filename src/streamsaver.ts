import streamSaver from 'streamsaver/StreamSaver.js';
import { settings } from './settings';

streamSaver.mitm =
  settings.streamsaverEndpoint ||
  'https://streaming.transcend.io/endpoint.html';

export { streamSaver };
