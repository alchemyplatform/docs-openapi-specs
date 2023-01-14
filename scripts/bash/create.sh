#!/usr/bin/env bash
args=("$@")
specPath=${args[0]}

echo 'Linting spec'
npx spectral lint ${specPath}

if [ $? -eq 0 ]; then
  echo 'Uploading new spec.. 🧨'
  node scripts/create.js ${specPath}
fi