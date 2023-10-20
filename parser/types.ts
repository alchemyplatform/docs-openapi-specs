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
  pathParams: OpenAPIV3_1.ParameterObject[];
  queryParams: OpenAPIV3_1.ParameterObject[];
  requestBody: OpenAPIV3_1.RequestBodyObject | undefined;
};

export type Param = {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  default?: string;
};

export type Entry = {
  category: string;
  networks: string[];
  url: string;
  method: string;
  docsUrl: string;
  pathParams: Param[];
  queryParams: Param[];
  requestBody: OpenAPIV3_1.RequestBodyObject | undefined;
};
