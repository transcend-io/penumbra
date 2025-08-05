import streamSaver from 'streamsaver/StreamSaver.js';
import { settings } from './settings';

// TODO: allow this to be set via JS API
streamSaver.mitm =
  settings.streamsaverEndpoint ||
  'https://streaming.transcend.io/endpoint.html';

export { streamSaver };
