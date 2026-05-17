#!/usr/bin/env sh
# Root publish script: adacad-drafting-lib -> docs -> ui
#
# Usage:
#   ./publish.sh          Build and publish lib, docs, and ui
set -e

root="$(cd "$(dirname "$0")" && pwd)"

echo "Publishing adacad-drafting-lib..."
(cd "${root}/packages/adacad-drafting-lib" && npm run build && npm login && npm publish)

echo "Publishing docs..."
(cd "${root}/projects/docs" && sh upload.sh)

echo "Publishing ui..."
(cd "${root}/projects/ui" && npm run build && npm run publish)

echo "All publishes complete."
