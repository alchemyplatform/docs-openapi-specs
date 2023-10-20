import { OpenAPIV3_1 } from '../node_modules/openapi-types/dist/index.d.js';

export type AlchemyDocument = OpenAPIV3_1.Document & {
  'x-sandbox': {
    category?: string;
  };
};

export type FlatEntry = {
  filename: string;
  chain: string;
  network: string;
  category: string;
  url: string;
  path: string;
  method: {
    name: string;
    verb: string;
    docsUrl: string;
  };
  params: OpenAPIV3_1.ParameterObject[];
  requestBody: OpenAPIV3_1.RequestBodyObject | undefined;
};

export type Entry = {
  category: string;
  networks: string[];
  url: string;
  method: string;
  docsUrl: string;
  params: OpenAPIV3_1.ParameterObject[];
};
