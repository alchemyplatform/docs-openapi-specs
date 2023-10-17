import fs from 'node:fs';
import path from 'node:path';

const ignoreList = [
  '.env',
  '.env.template',
  '.git',
  '.github',
  '.gitignore',
  '.prettierrc',
  '.spectral.yaml',
  'README.md',
  'evm_body.yaml',
  'evm_examples.yaml',
  'evm_responses.yaml',
  'components',
  'functions',
  'node_modules',
  'package.json',
  'package-lock.json',
  'scripts',
  'sdk_body.yaml',
  'sdk_responses.yaml',
];

async function* walk(dir: string): AsyncGenerator {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (ignoreList.includes(d.name)) continue;
    if (d.isDirectory()) yield* walk(entry);
    else if (d.isFile()) yield entry;
  }
}

// Then, use it with a simple async for loop
async function main() {
  console.log('Current directory', __dirname);
  const rootPath = path.join(__dirname, '../');
  console.log('Root path', rootPath);

  for await (const filePath of walk(rootPath)) {
    console.log('File path', filePath);
  }
}

main();

// 1. Loop through directories / walk through files

// 2. Get OpenAPI spec

// 3. Parse / dereference OpenAPI specs
