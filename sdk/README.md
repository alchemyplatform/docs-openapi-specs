## SDK Generation

Our goal is to use the Open API Specification to generate SDKs in other languages (Python, Go, etc..).

We currently have 2 issues that affect SDK generation:

- multiple OpenAPI specs
- API key in path

### Multiple Open API Specs

OAS is built for REST APIs.

As such, the Ethereum JSON RPC model (copied by other chains) in which requests are send to the same URL (e.g. https://eth-mainnet.alchemyapi.io/v2) using the same method (POST) leads to issues.

OAS expects different paths or/and methods for each request as opposed to same path, same method with different request bodies.

This sadly forces us to either:

- create separate specs for each method (1 spec for `eth_blockNumber`, 1 spec for `eth_chainId`, etc)

- use the OR operator to define multiple possible request bodies

This forbids us from maintaining 1 unifying spec that codifies all our APIs.
As an example, Plaid defines all its APIs in 1 spec `plaid.yml`.

Importantly for SDK generation, this means we cannot pass 1 `alchemy.yaml` file to SDK generators.

Generators take 1 YAML file as input and spit out 1 SDK as output.
Currently, if we do not merge the spec into 1 file, we will end up generating N SDKs where N is the number of YAML files.

Finally, given we only have 1 path & 1 method (POST), the generated SDK will only expose 1 method (e.g. `sdk.eth_chainId()`).

### API key in path

The 2nd issue is that we currently authenticate requests by passing the API key in the path (e.g. https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY).

This follows the convention set forth by Ethereum JSON RPC. Imo this is a bad convention in terms of security - request can be intercepted, logged by 3rd parties like Cloudflare, or MITM.

We decided to follow the convention for our Enhanced APIs (including NFT) although we can just pass the API key via a header. This is something we are looking into doing (timeline unclear).

Most importantly, authenticating the request this way is not a spec compliant security type.

`security` is optional so this is fine for our docs but more an issue when generating SDKs.

Generators will often use the `security` type to create an SDK you can initialize by passing the authentication type defined in `security`.

## Solution

To generate SDKs, we need to:

- create 1 OpenAPI spec `sdk.yaml`

- per method we want the SDK to expose,

  - add 1 'dummy' path
    (e.g. https://eth-mainnet.alchemyapi.io/v2/getChainId)

  - add 1 operationId (we can use the one in existing specs)

- replace 'dummy' paths by 'real' path to Alchemy blockchain endpoint (https://eth-mainnet.alchemyapi.io/v2)

- add authentication (tweak SDK initialization)

> We can do this manually initially and eventually write a script to automate most of this.
