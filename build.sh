#!/usr/bin/env sh
# Root build script: adacad-drafting-lib -> docs -> ui
#
# Usage:
#   ./build.sh          Build everything (lib, docs, ui)
#   ./build.sh --app    Skip docs, build only lib + ui (for app testing)
set -e

root="$(cd "$(dirname "$0")" && pwd)"
skip_docs=false

for arg in "$@"; do
    case "$arg" in
        --app) skip_docs=true ;;
        *) echo "Unknown flag: $arg"; echo "Usage: ./build.sh [--app]"; exit 1 ;;
    esac
done

# Clear stale build artifacts so Angular and tsc always compile from latest source
echo "Clearing cached build artifacts..."
rm -rf "${root}/packages/adacad-drafting-lib/dist"
rm -rf "${root}/projects/ui/.angular/cache"
rm -rf "${root}/projects/ui/dist"
if [ "$skip_docs" = false ]; then
    rm -rf "${root}/projects/docs/build"
fi

echo "Building adacad-drafting-lib..."
(cd "${root}/packages/adacad-drafting-lib" && npm run build)

if [ "$skip_docs" = false ]; then
    echo "Building docs..."
    (cd "${root}/projects/docs" && npm run build)
else
    echo "Skipping docs build (--app)"
fi

echo "Building ui..."
(cd "${root}/projects/ui" && npm run build)

echo "All builds complete."
