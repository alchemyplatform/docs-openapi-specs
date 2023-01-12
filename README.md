# Alchemy Docs

Hey there - thanks for checking our API docs!

This repo holds the OpenAPI specs that power our API Playgrounds ("Try it" sections on the right) at [docs.alchemy.com/reference](https://docs.alchemy.com/reference).

## Getting started

1. Clone the repo.

```bash
git clone https://github.com/alchemyplatform/docs-openapi-specs
```

2. Install dev dependencies.

```bash
npm i
```

## Frens 👋

Feedback? Issues? Typos?

We are continously trying to improve our docs - any help is very welcomed! 😀

You can:

- suggest edits (top right of Tutorials pages)
- share feedback using 'Did this page help you? sections (bottom of Tutorials / API Reference pages)
- open an issue [here](https://github.com/alchemyplatform/docs-openapi-specs/issues/new)

If you're feeling adventurous, feel free to open a pull request [here](https://github.com/alchemyplatform/docs-openapi-specs/compare).

> You currently can only modify API playgrounds. For pages or markdown edits in API Reference, please use one of the above options.

## Alchemists 👩‍🔬

To speed up your development, 2 scripts exists in the `scripts` directory.

- `scripts/create.js`
- `scripts/update.js`

You no longer need to run the `rdme` command line passing API key and Readme id to push to staging.

### First time?

> Make sure you first ran through the steps [above](#getting-started).

1. Clone `.env.template` into `.env`.

```bash
cp .env.template .env
```

2. Grab Readme API key.

3. Update `RDME_API_KEY` in `.env`.

### Creating new spec

Currently a manual process - TBD how we can automate this step.

1. Create a new .yaml file.
2. Run rdme command line.

### Updating spec

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

## Resources

- [OpenAPI Specification v3.1.0](https://spec.openapis.org/oas/latest.html)

- [Readme - OpenAPI Compatibility Chart](https://docs.readme.com/main/docs/openapi-compatibility-chart)
- [Readme - OpenAPI Extensions](https://docs.readme.com/main/docs/openapi-extensions)

- [Swagger.io - OpenAPI Guide](https://swagger.io/docs/specification/about/)
- [Documenting APIs - OpenAPI tutorial](https://idratherbewriting.com/learnapidoc/pubapis_openapi_step1_openapi_object.html)
