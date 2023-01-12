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

## Alchemists 👩‍🔬

To speed up your development, 2 scripts exists in the `scripts` directory.

- `scripts/create.js`
- `scripts/update.js`

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

Still a manual process - TBD how we can improve this step.

1. Create your spec (e.g. `transact/spec.yaml`).

2. Run `create` script.

```bash
  node scripts/create.js transact/spec.yaml
```

This will run the `rdme` command line tool 3 under the hood.

3. Select 'Create a new spec'.

This will

- deploy your spec to readme
- create a page and id
- associate page id with your spec

4. Your spec will be updated with a `x-readme.id` field. This is super important to ensure updates work smoothly in the future!

> Script is slightly hacky - could improve in future by using Readme's API to get id.

### Updating spec

Run `update` script. Ensure `x-readme.id` is set

```bash
node scripts/update.js pathtospec.yml
```

### Troubleshooting

1. Check `RDME_API_KEY` is set in `.env`.
2. Check you provided a valid path to a `.yaml` file when running the scripts.

```bash
node scripts/create.js newspec.yaml
node scripts/update.js existingspec.yaml
```

3. Check the spec has an `id` under `x-readme`. This Readme id is used to match the spec to a given API playground.
4. Reach out to Bastien if you have any issues running the scripts.

## Open API Specifications

We are progressively expanding linting using [Spectral](https://github.com/stoplightio/spectral).

Rules we follow:

- version: 3.1.0

Full list [here]() (coming soon).

## Future improvements

- OAS Components / Schemas: coming soon
- Linting: coming soon
- Duplication: scripts shared a lot of code (can be simplified)

## Resources

- [OpenAPI Specification v3.1.0](https://spec.openapis.org/oas/latest.html)

- [Readme - OpenAPI Compatibility Chart](https://docs.readme.com/main/docs/openapi-compatibility-chart)
- [Readme - OpenAPI Extensions](https://docs.readme.com/main/docs/openapi-extensions)

- [Swagger.io - OpenAPI Guide](https://swagger.io/docs/specification/about/)
- [Documenting APIs - OpenAPI tutorial](https://idratherbewriting.com/learnapidoc/pubapis_openapi_step1_openapi_object.html)
