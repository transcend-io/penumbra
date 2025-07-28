// eslint-disable-next-line import/no-unresolved
import fixtures from '../fixtures/files/fixtures.json' with { type: 'json' };

window.files = fixtures.filter((f) => f.filePrefix !== 'big');
