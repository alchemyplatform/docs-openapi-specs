import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import SwaggerParser from '@apidevtools/swagger-parser';
import { AlchemyDocument, Entry, FlatEntry, Param } from './types';
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
    console.log('==> File path', filePath);

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

              const category = extractCategory(api);
              const methodName = operation.operationId.replace(/-/g, '_');
              const methodVerb = method.toUpperCase();
              const readmeUrl =
                BASE_DOCS_URL +
                operation.operationId.toLowerCase().replace(/_/g, '-');

              // Note: currently ignores params in path, headers and cookies
              // assumption is we will not need this to build request in Sandbox
              const { /* pathParams, */ queryParams } = extractParams(
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
                // pathParams,
                queryParams,
                requestBody:
                  operation.requestBody as OpenAPIV3_1.RequestBodyObject,
              };
              // console.debug(entry);
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
    const requestBody = convertRequestBody(flatEntry.requestBody);
    const methodName =
      (requestBody && extractJSONRPCMethod(requestBody)) || method.name;
    const entry = groupedEntries[chain][methodName];
    if (!entry) {
      // strip / prefix from url if exists
      // TODO: we should be enforced in spec to have no trailing slash for servers url
      const url = flatEntry.url.endsWith('/')
        ? flatEntry.url.slice(0, -1)
        : flatEntry.url;
      const newEntry = {
        category: flatEntry.category,
        networks: [network],
        url: url + flatEntry.path,
        method: method.verb,
        docsUrl: method.docsUrl,
        // pathParams: flatEntry.pathParams
        //   .map(convertParam)
        //   .filter((param): param is Param => param != null),
        queryParams: flatEntry.queryParams
          .map(convertParam)
          .filter((param): param is Param => param != null),
        requestBody,
      };
      groupedEntries[chain][methodName] = newEntry;
    } else {
      const updatedEntry = {
        ...entry,
        networks: [...entry.networks, network],
      };
      groupedEntries[chain][methodName] = updatedEntry;
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

function extractCategory(api: AlchemyDocument) {
  const category = api['x-sandbox'].category;
  if (!category || !category.value) {
    throw new Error('Should have a sandbox category');
  }
  return category.value;
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

function extractJSONRPCMethod(param: Param): string | undefined {
  if (param.type !== 'object') return;
  if (param.properties['jsonrpc']?.default !== '2.0') return;

  return String(param.properties['method'].default);
}

function convertParam(param: OpenAPIV3_1.ParameterObject): Param | undefined {
  const { name, required, description } = param;
  const schema = convertSchema(param.schema as OpenAPIV3_1.SchemaObject);

  if (!schema) return;

  return {
    ...schema,
    name: name ?? schema.name,
    required: (required ?? schema.required) || undefined,
    description: description ?? schema.description,
  };
}

function convertSchema(schema: OpenAPIV3_1.SchemaObject): Param | undefined {
  if (schema == null || Object.keys(schema).length === 0) return;

  if (Array.isArray(schema)) {
    return convertParam(schema[0]);
  }

  if ('schema' in schema) {
    return convertParam(schema as OpenAPIV3_1.ParameterObject);
  }

  if (schema.allOf) {
    const allOf = schema.allOf as OpenAPIV3_1.SchemaObject[];

    return convertSchema({
      type: 'object',
      title: schema.title || allOf.find((param) => param.title)?.title,
      properties: allOf.reduce(
        (acc, param) => ({ ...acc, ...param.properties }),
        {},
      ) as Record<string, OpenAPIV3_1.SchemaObject>,
      required: allOf.flatMap((param) => param.required || [], []) || undefined,
    });
  }

  if (schema.oneOf) {
    const items = schema.oneOf
      .map(convertSchema)
      .filter((param): param is Param => param != null);

    if (items.length === 0) return;

    return { type: 'oneOf', name: schema.title, items };
  }

  if (schema.anyOf) {
    const items = schema.anyOf
      .map(convertSchema)
      .filter((param): param is Param => param != null);

    if (items.length === 0) return;

    return { type: 'anyOf', name: schema.title, items };
  }

  switch (schema.type) {
    case 'string':
      return {
        type: 'string',
        default: schema.default,
        description: schema.description,
        pattern: schema.pattern,
        enum: schema.enum,
        name: schema.title,
      };
    case 'number':
    case 'integer':
      return {
        type: schema.type,
        default: schema.default,
        description: schema.description,
        name: schema.title,
      };
    case 'boolean':
      return {
        type: 'boolean',
        default: schema.default,
        description: schema.description,
        name: schema.title,
      };
    case 'array':
      const items = convertSchema(schema.items);
      const prefixItems =
        'prefixItems' in schema && Array.isArray(schema.prefixItems)
          ? schema.prefixItems
              .map(convertSchema)
              .filter((param): param is Param => param != null)
          : [];

      if (prefixItems.length > 0) {
        return {
          type: 'tuple',
          default: schema.default,
          description: schema.description,
          name: schema.title,
          items: prefixItems,
        };
      }

      if (!items) return;

      return {
        type: 'array',
        default: schema.default,
        description: schema.description,
        max: schema.maxItems,
        min: schema.minItems,
        name: schema.title,
        items,
      };
    case 'object':
      const propertyEntries = Object.entries(schema.properties || {}).map(
        ([key, prop]) => {
          return [
            key,
            {
              ...convertSchema(prop),
              name: key,
              required: schema.required?.includes(key) || undefined,
            },
          ];
        },
      );

      if (propertyEntries.length === 0) return;

      return {
        type: 'object',
        description: schema.description,
        properties: Object.fromEntries(propertyEntries),
        name: schema.title,
      };
    default:
      throw new Error(`Schema type not supported: ${schema.type}`);
  }
}

function convertRequestBody(
  reqBody: OpenAPIV3_1.RequestBodyObject | undefined,
): Param | undefined {
  if (!reqBody) return;
  const bodyParam = Object.values(reqBody.content)[0];
  return convertSchema(bodyParam as OpenAPIV3_1.SchemaObject);
}
