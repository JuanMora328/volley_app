#!/bin/sh
set -eu

cd /app/apps/api
node ./node_modules/typeorm/cli.js -d dist/database/data-source.js migration:run
exec node dist/main.js
