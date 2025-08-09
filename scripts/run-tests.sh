#!/usr/bin/env bash
set -euo pipefail

# Run web-test-runner with all browsers, or specify specific browsers with e.g., `--browsers webkit firefox` or `--browsers chromium`
#
# Usage:
#   bash run-tests.sh
#   bash run-tests.sh --browsers webkit firefox
#   bash run-tests.sh --browsers chromium
#
# Arguments are passed to `web-test-runner`.


# Parse the browsers from the --browsers arguments, or use the default
DEFAULT_BROWSERS=("chromium" "webkit" "firefox")
OVERRIDE_BROWSERS=false
BROWSERS=()
for arg in "$@"; do
  if [[ "$arg" == --browsers* ]]; then
    OVERRIDE_BROWSERS=true
    BROWSERS+=("${arg#--browsers=}")
  fi
done
if [ "$OVERRIDE_BROWSERS" = false ]; then
  BROWSERS+=("${DEFAULT_BROWSERS[@]}")
fi

# Run the tests, and pass additional arguments to the web-test-runner
pnpm exec web-test-runner \
  --files tests/**/*.test.ts \
  --node-resolve \
  --playwright \
  --debug \
  --coverage \
  --browsers "${BROWSERS[@]}" \
  "$@"

