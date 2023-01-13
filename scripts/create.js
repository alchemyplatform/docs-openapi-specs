require('dotenv').config();

const fs = require('fs');
const { stringify } = require('yaml');
const OASNormalize = require('oas-normalize').default;
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

  // 2. Deference and validate spec
  const oas = new OASNormalize(filePath, {
    enablePaths: true,
    colorizeErrors: true,
  });

  const validatedSpec = await oas.validate();

  // derefSpec will have replaced refs with imported definitions
  const derefSpec = await oas.deref();
  // spec needs to be string to upload to readme
  const spec = JSON.stringify(derefSpec, null, 2);
  // console.log(spec);

  // 3. Upload new specification / get id back from Readme API
  const readme = new Readme(key);
  const id = await readme.spec.upload({ spec });

  // 4. Add id to spec!
  const updatedSpec = { ...validatedSpec };
  updatedSpec['x-readme'].id = id;

  fs.writeFileSync(filePath, stringify(updatedSpec));
  console.log(`${filePath} => added id ${id} (x-readme.id)\n`);

  const found = await readme.spec.find({ id });
  if (found) {
    const url = Readme.utils.createUrlFromSlug(found.category?.slug);
    console.log(`URL => ${url}`);
  }
})();
