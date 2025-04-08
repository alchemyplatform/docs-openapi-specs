require('dotenv').config();

const fs = require('node:fs');
const { parse, stringify } = require('yaml');
const parser = require('@openapi-generator-plus/json-schema-ref-parser');
const { Readme } = require('./Readme');

// TODO: lint OpenAPI?
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

  const contents = fs.readFileSync(filePath, 'utf-8');
  const originalSpec = parse(contents);

  // derefSpec will have replaced refs with imported definitions
  const derefSpec = await parser.dereference(filePath);
  if (derefSpec['x-readme']?.id) {
    throw new Error(`Id found.\nAre you sure you want to create a new spec?

update new spec => run scripts/update.js spec.yaml
create new spec => remove id from spec`);
  }

  // spec needs to be string to upload to readme
  const spec = JSON.stringify(derefSpec, null, 2);
  // console.log(spec);

  // 3. Upload new specification / get id back from Readme API
  const readme = new Readme(key);
  const id = await readme.spec.upload({ spec });

  // 4. Add id to spec!
  if (!originalSpec['x-readme']) {
    originalSpec['x-readme'] = {
      id: id,
    };
  } else {
    originalSpec['x-readme'].id = id;
  }

  fs.writeFileSync(filePath, stringify(originalSpec));
  console.log(`Added id ${id} (x-readme.id)\n`);

  const found = await readme.spec.find({ id });
  if (found) {
    const url = Readme.utils.createUrlFromSlug(found.category?.slug);
    console.log(`URL => ${url}`);
  }
})();
