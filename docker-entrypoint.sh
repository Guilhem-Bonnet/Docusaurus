#!/bin/sh
# entrypoint: populate /opt/docusaurus/node_modules from .image_node_modules if empty,
# otherwise run npm ci as fallback, then exec the CMD.
set -e
cd /opt/docusaurus || exit 1

echo "[entrypoint] checking node_modules..."
need_install=0
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "[entrypoint] node_modules missing or empty"
  need_install=1
else
  # Quick runtime test: try to resolve a known plugin. If it fails, we'll trigger install/copy.
  echo "[entrypoint] node_modules present — testing plugin resolution"
  if ! node -e "try{require.resolve('@r74tech/docusaurus-plugin-panzoom'); process.exit(0);}catch(e){process.exit(1);}" 2>/dev/null; then
    echo "[entrypoint] plugin @r74tech/docusaurus-plugin-panzoom not resolvable — will re-init node_modules"
    need_install=1
  else
    echo "[entrypoint] plugin resolved — no install needed"
    need_install=0
  fi
fi

if [ "$need_install" -eq 1 ]; then
    if [ -d /usr/local/.image_node_modules ] && [ "$(ls -A /usr/local/.image_node_modules 2>/dev/null)" ]; then
      echo "[entrypoint] copying preinstalled modules from /usr/local/.image_node_modules to node_modules"
      rm -rf node_modules || true
      mkdir -p node_modules
      cp -a /usr/local/.image_node_modules/. node_modules/
  else
    echo "[entrypoint] running npm ci to install dependencies"
    npm ci --no-audit --no-fund --include=dev
  fi
fi

exec "$@"
