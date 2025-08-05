/**
 * esbuild (via Vite) doesn't rewrite the import URL .ts to .js
 * @see https://github.com/evanw/esbuild/issues/312
 */
import './worker';
