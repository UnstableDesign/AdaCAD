#!/usr/bin/env sh
# Root build script: adacad-drafting-lib -> docs -> ui
set -e

root="$(cd "$(dirname "$0")" && pwd)"

# Clear stale build artifacts so Angular and tsc always compile from latest source
echo "Clearing cached build artifacts..."
rm -rf "${root}/packages/adacad-drafting-lib/dist"
rm -rf "${root}/projects/ui/.angular/cache"
rm -rf "${root}/projects/ui/dist"

echo "Building adacad-drafting-lib..."
(cd "${root}/packages/adacad-drafting-lib" && npm run build)

echo "Building docs..."
(cd "${root}/projects/docs" && npm run build)

echo "Building ui..."
(cd "${root}/projects/ui" && npm run build)

echo "All builds complete."



