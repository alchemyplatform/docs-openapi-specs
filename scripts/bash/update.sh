#!/usr/bin/env bash
args=("$@")
specPath=${args[0]}

echo 'Linting spec'
npx spectral lint ${specPath}

if [ $? -eq 0 ]; then
  echo 'Updating spec.. 🔨'
  node scripts/update.js ${specPath}
fi