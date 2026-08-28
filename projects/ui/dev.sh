#!/usr/bin/env sh
# Rebuild adacad-drafting-lib, reinstall ui deps, and start the dev server.
#
# Usage:
#   ./dev.sh              Start on the default port
#   ./dev.sh --port 4300  Extra args are forwarded to `ng serve`
set -e
ui_dir="$(cd "$(dirname "$0")" && pwd)"
lib_dir="${ui_dir}/../../packages/adacad-drafting-lib"
echo "==> Building adacad-drafting-lib"
cd "${lib_dir}"
[ -d node_modules ] || npm install
rm -rf dist
npm run build
echo "==> Reinstalling projects/ui dependencies"
cd "${ui_dir}"
npm install
echo "==> Clearing Angular build cache"
rm -rf .angular/cache
echo "==> Starting dev server"
npx ng serve "$@"