require('dotenv').config();

const fs = require('fs');
const { spawn } = require('node:child_process');
const { parse, stringify } = require('yaml');

// see https://www.npmjs.com/package/rdme#authentication
const key = process.env.RDME_API_KEY;
if (!key) {
  throw new Error('Please set RDME_API_KEY in .env');
}

// 1. Get file path
const filePath = process.argv[2];

if (!filePath || !filePath.endsWith('.yaml')) {
  throw new Error('Please provide a YAML file (.yaml)');
}
console.log(`File path => ${filePath}`);

// 2. Read file contents
const contents = fs.readFileSync(filePath, 'utf-8');

// 3. Parse yaml
const yaml = parse(contents);
// console.log(yaml);

// TODO: lint OpenAPI?
// TODO: validate OpenAPI? currently fallbacks to rdme command to do this

// 4. Get operationId (used in url)
// 1st path item, 1st operation
const pathItem = Object.values(yaml.paths)[0];
const operation = Object.values(pathItem)[0];
const operationId = operation.operationId;

// 5. Build URL
// TODO: invalid url if spec with same operationId already deployed
const baseUrl = 'https://alchemyenterprisegroup.readme.io/reference';
const url = `${baseUrl}/${operationId.toLowerCase()}`;

// 6. Run readme command
console.log(`Running rdme command..\n`);

const cmd = 'npx';
const args = ['rdme', 'openapi', filePath, `--key=${key}`];

// option 1 - no access to stdout / use readme API to get latest spec / spec by name https://docs.readme.com/main/reference/getapispecification
// const opts = { stdio: ['inherit', 'inherit', 'inherit'] };
// const ps = spawn(cmd, args, opts);

// option 2 - only pipe stdout
// console.clear() will remove logs above
const opts = { stdio: ['inherit', 'pipe', 'inherit'] };
const ps = spawn(cmd, args, opts);

// 7. Get readme id and save in spec
ps.stdout.on('data', (data) => {
  console.clear();

  const text = data.toString();
  console.log(text);

  // search for string
  // rdme openapi spec.yaml --key=<key> --id=63bf7df1df71eb001007ffe9
  if (text.includes('.yaml --key=<key> --id=')) {
    const prefix = '--id=';
    const index = text.indexOf(prefix);

    const id = text.substring(index + prefix.length).replace('\n', '');

    const updatedYaml = { ...yaml };
    updatedYaml['x-readme'].id = id;
    // console.log(updatedYaml);
    fs.writeFileSync(filePath, stringify(updatedYaml));
    console.log(` ${filePath} => added id ${id} (x-readme.id)\n`);

    console.log(`Url => ${url}`);
  }
});
