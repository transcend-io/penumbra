import streamSaver from 'streamsaver/StreamSaver.js';

// TODO: allow this to be set via JS API
streamSaver.mitm = 'https://streaming.transcend.io/endpoint.html';

export { default as streamSaver } from 'streamsaver/StreamSaver.js';
