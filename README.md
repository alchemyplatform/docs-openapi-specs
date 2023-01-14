# Alchemy Docs

Hey there - thanks for checking our API docs! 👋

This repo holds the OpenAPI specs that power our API Playgrounds at [docs.alchemy.com/reference](https://docs.alchemy.com/reference) ("Try it" sections on the right).

## Getting started

1. Clone the repo.

```bash
git clone https://github.com/alchemyplatform/docs-openapi-specs
```

2. Install dev dependencies.

```bash
npm i
```

## Frens

Feedback? Issues? Typos?

We are continously trying to improve our docs - any help is very welcomed! 😀

You can:

- suggest edits (top right of Tutorials pages)
- share feedback using 'Did this page help you? sections (bottom of Tutorials / API Reference pages)
- open issues [here](https://github.com/alchemyplatform/docs-openapi-specs/issues/new)

If you're feeling adventurous, feel free to open a pull request [here](https://github.com/alchemyplatform/docs-openapi-specs/compare).

> You currently can only modify API playgrounds. For pages or markdown edits in API Reference, please use one of the above options.

# WIP 👷‍♀️

> Below section is WIP.
> Until we had ids to every spec, deploy specs as you normally would

## Alchemists 👩‍🔬

To speed up your development, 2 commands are now available.

- `npm run create spec.yaml`
- `npm run update spec.yaml`

You no longer need to run the `rdme` command line directly to push to staging.
You also no longer need to pass an API key and readme id! 🎉

### First time?

> Make sure you first ran through the steps [above](#getting-started).

1. Clone `.env.template` into `.env`.

```bash
cp .env.template .env
```

2. Grab Readme API key.

3. Update `RDME_API_KEY` in `.env`.

### Creating new spec

> Known issue: will remove comments and format spec when run.

1. Write your spec (e.g. `newspec.yaml`).

2. Run `create` script passing the path to your spec.

```bash
  npm run create transact/newspec.yaml
```

This will run the `rdme` command line tool 3 under the hood.

3. Select 'Create a new spec'.

This will:

- deploy your spec to readme
- create a page and id
- associate page id with your spec

4. Your spec will be updated with a `x-readme.id` field. This is super important to ensure updates work smoothly in the future!

> Script is slightly hacky - could improve in future by using Readme's API to get id.

### Updating spec

Run `update` script. Ensure `x-readme.id` is set

```bash
npm run update spec.yml
```

### Troubleshooting

1. Check `RDME_API_KEY` is set in `.env`.
2. Check you provided a valid path to a `.yaml` file when running the scripts.

```bash
npm run create spec.yaml
npm run update spec.yaml
```

3. Check the spec has an `id` under `x-readme`. This Readme id is used to match the spec to a given API playground.
4. Reach out to Bastien if you have any issues running the scripts.

## Linting

Linting is ran automatically using `npm run create` and `npm run update` powered by [Spectral](https://github.com/stoplightio/spectral).

You can also run it manually using

```bash
npx spectral lint spec.yaml
```

Rules we follow:

- version: 3.1.0
- x-readme.id is required
- at least 1 servers.url
- operation keys order: summary, description, operationId, parameters
- operationId: must use - not \_ (used in url)
- operationId: standardize naming
- responses: should have 200, and list of errors

Full list [here](.spectral.yaml).

You should also install the extension for your editor.

- [JetBrains Plugin](https://plugins.jetbrains.com/plugin/18520-spectral)
- [VS Code Spectral Extension](https://marketplace.visualstudio.com/items?itemName=stoplight.spectral)

### Quirks

We currently cannot use [`oas-normalize`](https://github.com/readmeio/oas-normalize) to resolve $refs in specs.

It relies on [`@readme/openapi-parser`](https://github.com/readmeio/openapi-parser) which relies on [`@readme/json-schema-ref-parser`](https://github.com/readmeio/json-schema-ref-parser).

`@readme/json-schema-ref-parser` is a fork of [`@apidevtools/json-schema-ref-parser`](https://github.com/APIDevTools/json-schema-ref-parser).

This is a known issue of `json-schema-ref-parser` - see [here](https://github.com/APIDevTools/json-schema-ref-parser/issues/200#issuecomment-1157687009).

Until the issue gets resolved and changes merged upstream, the solution is to dereference the spec using `@openapi-generator-plus/json-schema-ref-parser`(https://www.npmjs.com/package/@openapi-generator-plus/json-schema-ref-parser).

This also means validation needs to be done via another package than `oas-normalize` - we use Spectral to validate and lint the spec.

## Future improvements

- OAS Components / Schemas: coming soon
- add more linting rules

**Scripts**

- update multiple specs at once!
- `create` and `update` scripts share a lot of code (can be simplified)
- `create` script remove comments

## Resources

- [OpenAPI Specification v3.1.0](https://spec.openapis.org/oas/latest.html)

- [Readme - OpenAPI Compatibility Chart](https://docs.readme.com/main/docs/openapi-compatibility-chart)
- [Readme - OpenAPI Extensions](https://docs.readme.com/main/docs/openapi-extensions)

- [Swagger.io - OpenAPI Guide](https://swagger.io/docs/specification/about/)
- [Documenting APIs - OpenAPI tutorial](https://idratherbewriting.com/learnapidoc/pubapis_openapi_step1_openapi_object.html)

- [Stoplight.io - Spectral](https://docs.stoplight.io/docs/spectral/674b27b261c3c-overview)
- [JSONPath](https://goessner.net/articles/JsonPath/index.html)
