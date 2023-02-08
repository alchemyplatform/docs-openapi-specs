require('dotenv').config();

const fs = require('fs');
const { exec } = require('node:child_process');
const { parse } = require('yaml');

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

// 4. Search for x-readme id
const id = yaml['x-readme']?.id;
console.log(`Readme id => ${id}`);

if (!id) {
  throw new Error('No id found - ensure it is set at x-readme.id');
}

// 5. Get operationId (used in url)
// 1st path item, 1st operation
const pathItem = Object.values(yaml.paths)[0];
const operation = Object.values(pathItem)[0];
const operationId = operation.operationId;

// 6. Build URL
const baseUrl = 'https://alchemyenterprisegroup.readme.io/reference';
const url = `${baseUrl}/${operationId.toLowerCase()}`;

// 7. Run readme command
const command = `npx rdme openapi ${filePath} --key=${key} --id=${id}`;
console.log(`Running rdme command..\n`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }

  if (stdout) {
    console.log(`${stdout}`);
    console.log(url);
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
});
