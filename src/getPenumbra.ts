// local
import MOCK_API from './mock';
import { PenumbraAPI } from './types';

/**
 * Get the penumbra from window and ensure it is defined
 *
 * @param mock - Mock penumbra when environment variable `PENUMBRA_MOCK` is true
 * @returns The penumbra API object
 */
export default function getPenumbra(
  mock = process.env.PENUMBRA_MOCK === 'true',
): PenumbraAPI {
  // Mock the API
  if (mock) {
    return MOCK_API;
  }

  // Pull off of the window
  const { penumbra } = self; // eslint-disable-line no-restricted-globals

  if (!penumbra) {
    throw new Error(
      'Penumbra does not exist on self! Ensure it is loaded in the index.html file',
    );
  }

  return penumbra;
}
