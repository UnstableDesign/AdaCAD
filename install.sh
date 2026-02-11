#!/usr/bin/env sh
# Root install script: installs dependencies for adacad-drafting-lib, ui, docs, screenshot-generator (in order)
set -e

root="$(cd "$(dirname "$0")" && pwd)"

echo "Installing packages/adacad-drafting-lib..."
(cd "${root}/packages/adacad-drafting-lib" && npm install)

echo "Installing projects/ui..."
(cd "${root}/projects/ui" && npm install --legacy-peer-deps)

echo "Installing projects/docs..."
(cd "${root}/projects/docs" && npm install)

echo "Installing projects/screenshot-generator..."
(cd "${root}/projects/screenshot-generator" && npm install)

echo "All installs complete."
