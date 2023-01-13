require('dotenv').config();

const fs = require('fs');
const { parse, stringify } = require('yaml');
const parser = require('@apidevtools/json-schema-ref-parser');
const { Readme } = require('./Readme');

// TODO: lint OpenAPI?
// TODO: validate OpenAPI? currently fallbacks to rdme command to do this

(async () => {
  // see https://www.npmjs.com/package/rdme#authentication
  const key = process.env.RDME_API_KEY;
  if (!key) {
    throw new Error('Please set RDME_API_KEY in .env');
  }

  const filePath = process.argv[2];

  if (!filePath || !filePath.endsWith('.yaml')) {
    throw new Error('Please provide a YAML file (.yaml)');
  }
  console.log(`File path => ${filePath}`);

  // 2. Read file contents
  const contents = fs.readFileSync(filePath, 'utf-8');

  // 3. Parse yaml
  const yaml = parse(contents);
  console.log(stringify(yaml));

  // see https://phil.tech/2022/bundling-openapi-with-javascript/
  // see https://github.com/APIDevTools/json-schema-ref-parser#example
  // see https://github.com/stoplightio/json-schema-ref-parser

  // alternative - https://github.com/readmeio/oas
  // https://www.npmjs.com/package/oas-normalize
  const flatten = await parser.dereference(yaml);

  const spec = JSON.stringify(flatten, null, 2);
  console.log(spec);

  // 4. Upload specification
  const readme = new Readme(key);
  const id = await readme.spec.upload({ spec });
  console.log(id);

  // Add id to spec!
  const updatedYaml = { ...yaml };
  updatedYaml['x-readme'].id = id;
  // console.log(updatedYaml);
  fs.writeFileSync(filePath, stringify(updatedYaml));
  console.log(` ${filePath} => added id ${id} (x-readme.id)\n`);

  // const id = '63c18f5c68b7e4004406888f';
  const found = await readme.spec.find({ id });
  console.log(found);

  if (found) {
    const url = Readme.utils.createUrlFromSlug(found.category?.slug);
    console.log(url);
  }
})();
