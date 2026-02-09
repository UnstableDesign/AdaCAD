#!/usr/bin/env sh
# Root build script: adacad-drafting-lib -> docs -> ui
set -e

root="$(cd "$(dirname "$0")" && pwd)"

echo "Building adacad-drafting-lib..."
(cd "${root}/packages/adacad-drafting-lib" && npm run build)

echo "Building docs..."
(cd "${root}/projects/docs" && npm run build)

echo "Building ui..."
(cd "${root}/projects/ui" && npm run build)

echo "All builds complete."



