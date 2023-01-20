require('dotenv').config();

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

  // 3. Dereference the spec
  // derefSpec will have replaced refs with imported definitions
  const derefSpec = await parser.dereference(filePath);
  // spec needs to be string to upload to readme
  const spec = JSON.stringify(derefSpec, null, 2);
  // console.log(spec);

  // 4. Search for x-readme id
  const id = derefSpec['x-readme']?.id;
  if (!id) {
    throw new Error('No id found at x-readme.id');
  }
  console.log(`Readme id => ${id}`);

  // 5. Update specification
  const readme = new Readme(key);
  await readme.spec.update({ id, spec });

  console.log('Updated!');
  // const found = await readme.spec.find({ id });
  // if (found) {
  //   const url = Readme.utils.createUrlFromSlug(found.category?.slug);
  //   console.log(`URL => ${url}`);
  // }
})();
