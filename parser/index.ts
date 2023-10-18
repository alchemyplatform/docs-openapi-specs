import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import SwaggerParser from '@apidevtools/swagger-parser';

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
  'parser',
  'scripts',
];

async function* walk(dir: string): AsyncGenerator<string> {
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

  // 1. Loop through directories / walk through files

  // 1 entry per chain, per method
  const entries = [
    {
      fileName: '',
      chain: '',
      url: '', // TODO: maybe best if we dont have an array of networks
      networks: ['mainnet', 'goerli'],
      category: '',
      method: 'eth_blockNumber',
      params: [],
    },
  ];

  for await (const filePath of walk(rootPath)) {
    console.log('\n\n');
    // console.log(filePath);

    // Convert YAML to JSON
    // 2. Get OpenAPI spec
    const contents = fs.readFileSync(filePath, 'utf-8');
    const json = parse(contents);
    // console.log(json);

    // 3. Parse / dereference OpenAPI specs
    try {
      const api = await SwaggerParser.validate(json);
      const fileName = filePath.split('/').at(-1);

      // @ts-ignore
      const servers = api.servers as Array<{
        url: string;
        variables?: {
          network: {
            enum: string[];
            default: string;
          };
        };
      }>;
      console.log(JSON.stringify(servers, null, 2));

      if (servers.length !== 1) {
        throw new Error(`Expected 1 server, got ${servers.length}`);
      }

      // if variables key exists in spec - lets get the networks
      // if not let's parse the URL

      // TODO: do we want to add variables for all files?
      // TODO: move Debug and Trace bodies out of shared files
      if (servers[0].variables) {
        const networks = servers[0].variables?.network.enum ?? [];
        // console.log(networks);
      } else {
        const networks = extractSubdomain(url);
        console.log(networks);
      }

      // const paths = api.paths;
      // console.log(paths);
    } catch (err) {
      console.error(err);
    }
  }
}

main();

function extractSubdomain(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const hostParts = parsedUrl.host.split('.');

    if (hostParts.length >= 2) {
      return hostParts[0];
    }

    return null;
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
}

// Example usage:
const url = 'https://astar-mainnet.g.alchemy.com/v2';
const subdomain = extractSubdomain(url);
if (subdomain) {
  console.log(subdomain); // Output: "astar-mainnet"
} else {
  console.log('Subdomain not found in the URL.');
}
