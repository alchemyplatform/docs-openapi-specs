import { OpenAPIV3_1 } from '../node_modules/openapi-types/dist/index.d.js';

export type AlchemyDocument = OpenAPIV3_1.Document & {
  'x-sandbox': {
    category?: {
      type: {
        name: string;
        type: string;
        enum: string[];
      };
      value: string;
    };
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
  // pathParams: OpenAPIV3_1.ParameterObject[];
  queryParams: OpenAPIV3_1.ParameterObject[];
  requestBody: OpenAPIV3_1.RequestBodyObject | undefined;
};

interface BaseParam<Value> {
  name?: string;
  description?: string;
  required?: boolean;
  default?: Value | null;
  enum?: Value[];
}

interface StringParam extends BaseParam<string> {
  type: 'string';
  pattern?: string;
}

interface IntegerParam extends BaseParam<number> {
  type: 'integer';
}

interface NumberParam extends BaseParam<number> {
  type: 'number';
}

interface BooleanParam extends BaseParam<number> {
  type: 'boolean';
}

type PrimitiveParam = StringParam | IntegerParam | NumberParam | BooleanParam;

interface ArrayParam<Item> extends BaseParam<PrimitiveParam[]> {
  type: 'array';
  items: Item;
  min?: number;
  max?: number;
}

interface ObjectParam<Item> extends BaseParam<Record<string, PrimitiveParam>> {
  type: 'object';
  properties: Record<string, Item>;
}

interface OneOfParam<Item> extends BaseParam<PrimitiveParam> {
  type: 'oneOf';
  items: Item[];
}

interface AnyOfParam<Item> extends BaseParam<PrimitiveParam> {
  type: 'anyOf';
  items: Item[];
}

export type Param =
  | PrimitiveParam
  | ArrayParam<Param>
  | ObjectParam<Param>
  | OneOfParam<Param>
  | AnyOfParam<Param>;

export type Entry = {
  category: string;
  networks: string[];
  url: string;
  method: string;
  docsUrl: string;
  // pathParams: Param[];
  queryParams: Param[];
  requestBody: Param | undefined;
};
