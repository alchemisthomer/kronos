# oauth-server

> Standalone Node/Express service that completes the GitHub App user-to-server OAuth code-for-token exchange on behalf of the browser runner.

**Status:** to be scaffolded after design review converges. See [`../DESIGN.md`](../DESIGN.md) for the design context.

## What this will be

A tiny Node/Express service that receives an OAuth authorization code from the browser runner and exchanges it for a user-to-server access token by calling GitHub's `/login/oauth/access_token` endpoint. The service holds the GitHub App's client-secret; the browser runner never sees it.

This is required only when the runner is deployed with GitHub App OAuth enabled. The runner works fully in PAT-only mode without this service.

## Relationship to the eos oauth-server

The kronos oauth-server is a sibling to the `alchemisthomer/eos` oauth-server. In most deployments, a single oauth-server instance will serve both runners — one GitHub App can be configured with permissions covering both `kronos/engagement/**` and `foundation/eos/cycle/**` operations, and both runners route their OAuth exchanges to the same server.

For deployments that prefer isolation (per-framework GitHub Apps with distinct client credentials), the oauth-server code is portable and can be deployed once per framework with different environment configuration.

The code in this folder is expected to be nearly identical to the eos oauth-server code; the difference is which client credentials it holds and which redirect URIs it accepts.

## Configuration

Environment variables (to be documented on scaffold):

- `GITHUB_APP_CLIENT_ID`
- `GITHUB_APP_CLIENT_SECRET`
- `ALLOWED_REDIRECT_URIS` — comma-separated list of runner-hosted URLs allowed to complete OAuth exchange
- `PORT` — HTTP port to listen on

## Endpoints

- `POST /oauth/exchange` — accepts `{ code, redirect_uri }`, calls GitHub, returns `{ access_token, expires_in, refresh_token }` or a structured error.
- `GET /health` — liveness check.

No other endpoints. The service is intentionally minimal.

## With and without olympus-grid support

The service ships in two configurations:

- **Standalone.** The default. Just the OAuth exchange described above. Deployable anywhere that runs Node.
- **Olympus-grid-integrated.** An optional configuration that additionally records OAuth events into the olympus-grid ledger (`LedgerEntry__c`) for organizations that want cross-system observability. This configuration requires the olympus-grid pantheon to be reachable from the service. Standalone deployments do not require or invoke the olympus-grid integration.
