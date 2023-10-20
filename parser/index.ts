import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import SwaggerParser from '@apidevtools/swagger-parser';
import { AlchemyDocument, Entry, FlatEntry } from './types';
import { OpenAPIV3_1 } from '../node_modules/openapi-types/dist/index.d.js';

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

const BASE_DOCS_URL = 'https://docs.alchemy.com/reference/';

// Then, use it with a simple async for loop
async function main() {
  console.log('Current directory', __dirname);
  const rootPath = path.join(__dirname, '../');
  console.log('Root path', rootPath);

  // 1. Loop through directories / walk through files

  const flatEntries: FlatEntry[] = [];

  for await (const filePath of walk(rootPath)) {
    console.log('\n\n');

    // 2. Get OpenAPI spec
    const contents = fs.readFileSync(filePath, 'utf-8');
    // Convert YAML to JSON
    const json = parse(contents);

    // 3. Parse / dereference OpenAPI specs
    try {
      const api = (await SwaggerParser.validate(json)) as AlchemyDocument;
      const fileName = filePath.split('/').at(-1);
      if (!fileName) throw new Error('File name not found');

      // @ts-ignore
      const servers = api.servers as OpenAPIV3_1.ServerObject[];
      const { baseUrl, chainsToNetworks } = extractChainAndNetworks(servers[0]);

      const paths = api.paths;
      if (!paths) throw new Error('Paths not found in spec');

      for (const [path, pathItem] of Object.entries(paths)) {
        // TODO: fix types
        // TODO: method could actually be summary, description
        // @ts-ignore
        for (const [method, op] of Object.entries(pathItem)) {
          // console.log(method, operation);

          const operation = op as OpenAPIV3_1.OperationObject;

          for (const [chain, networks] of chainsToNetworks) {
            for (const network of networks) {
              // TODO: hacky logic (should replace)
              const parsedUrl = baseUrl.includes('{network}')
                ? baseUrl.replace('{network}', [chain, network].join('-'))
                : baseUrl;

              if (!operation.operationId) {
                throw new Error('Operation ID not found');
              }

              const category = api['x-sandbox']?.category ?? 'none provided';
              const methodName = operation.operationId;
              const methodVerb = method.toUpperCase();
              const readmeUrl =
                BASE_DOCS_URL +
                operation.operationId.toLowerCase().replace(/_/g, '-');

              // Note: currently ignores params in headers and cookies
              // assumption is we will not need this to build request in Sandbox
              const { pathParams, queryParams } = extractParams(
                operation.parameters as
                  | OpenAPIV3_1.ParameterObject[]
                  | undefined,
              );
              const entry = {
                filename: fileName,
                chain,
                network,
                category,
                url: baseUrl,
                path,
                method: {
                  name: methodName,
                  verb: methodVerb,
                  docsUrl: readmeUrl,
                },
                pathParams,
                queryParams,
                requestBody:
                  operation.requestBody as OpenAPIV3_1.RequestBodyObject,
              };
              console.debug(entry);
              flatEntries.push(entry);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
  console.log(`Generated ${flatEntries.length} entries.`);

  // Group entries by chain, network, and method
  const groupedEntries: {
    [chain: string]: {
      [method: string]: Entry;
    };
  } = {};

  for (const flatEntry of flatEntries) {
    const { chain, network, method } = flatEntry;
    if (!groupedEntries[chain]) {
      groupedEntries[chain] = {};
    }

    const entry = groupedEntries[chain][method.name];
    if (!entry) {
      const newEntry = {
        category: 'core',
        networks: [network],
        url: flatEntry.url + flatEntry.path,
        method: method.verb,
        docsUrl: method.docsUrl,
        pathParams: flatEntry.pathParams,
        queryParams: flatEntry.queryParams,
      };
      params: groupedEntries[chain][method.name] = newEntry;
    } else {
      const updatedEntry = {
        ...entry,
        networks: [...entry.networks, network],
      };
      groupedEntries[chain][method.name] = updatedEntry;
    }
  }

  const outputFilePath = path.join(__dirname, 'output.json');
  await fs.promises.writeFile(
    outputFilePath,
    JSON.stringify(groupedEntries, null, 2),
  );
}

main();

function extractChainAndNetworks(servers: OpenAPIV3_1.ServerObject): {
  baseUrl: string;
  chainsToNetworks: Map<string, Set<string>>;
} {
  const { url, variables } = servers;

  // if variables key exists in spec - lets get the networks
  // if not let's parse the URL

  const chainsToNetworks: Map<string, Set<string>> = new Map();

  if (variables) {
    const values = variables.network.enum ?? [];
    for (const value of values) {
      const parts = value.split('-');
      if (parts.length !== 2) {
        throw new Error('Should have 2 parts');
      }
      const chain = parts[0];
      const network = parts[1];

      const networks = chainsToNetworks.get(chain);
      if (networks) {
        chainsToNetworks.set(chain, networks.add(network));
      } else {
        chainsToNetworks.set(chain, new Set([network]));
      }
    }
  } else {
    const subdomain = extractSubdomain(url);
    if (!subdomain) {
      throw new Error(`Subdomain not found in the URL.`);
    }
    const parts = subdomain.split('-');
    if (parts.length !== 2) {
      throw new Error('Should have 2 parts');
    }
    const chain = parts[0];
    const network = parts[1];

    const networks = chainsToNetworks.get(chain);
    if (networks) {
      chainsToNetworks.set(chain, networks.add(network));
    } else {
      chainsToNetworks.set(chain, new Set([network]));
    }
  }
  return { baseUrl: url, chainsToNetworks };
}

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

function extractParams(params: OpenAPIV3_1.ParameterObject[] | undefined): {
  pathParams: OpenAPIV3_1.ParameterObject[];
  queryParams: OpenAPIV3_1.ParameterObject[];
} {
  if (!params) return { pathParams: [], queryParams: [] };
  const pathParams = params.filter((param) => param.in === 'path');
  const queryParams = params.filter((param) => param.in === 'query');
  return { pathParams, queryParams };
}
