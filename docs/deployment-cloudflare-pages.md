# Deploying to Cloudflare Pages

[Cloudflare Pages](https://pages.cloudflare.com) serves static sites from
Cloudflare's global network. The free tier includes custom domains and HTTPS.

Back to [deployment overview](deployment.md).

## Before you start

1. Create a Cloudflare account.
2. Find your account ID. It appears in the sidebar of the Cloudflare dashboard,
   under your account name.
3. Create an API token. Go to My Profile, then API Tokens, then Create Token.
   Use the Edit Cloudflare Workers template, or create a custom token with the
   Account, Cloudflare Pages, Edit permission. Limit it to your account.
4. Set `url` in `apps/web/src/_data/site.yml` to your production address.
   Use `https://<project>.pages.dev` or your custom domain.

## Create the project

A Pages project holds one site. Create it once before the first deploy. Pick a
project name. The name becomes part of the default `<project>.pages.dev`
address.

Create the project from the dashboard under Workers and Pages, then Create, then
Pages. Or create it from the command line:

```sh
pnpm dlx wrangler login
pnpm dlx wrangler pages project create my-site --production-branch main
```

## Manual deploy

Build the site, then upload the output folder with Wrangler:

```sh
pnpm build
pnpm dlx wrangler pages deploy apps/web/_site --project-name=my-site
```

The first time you run this, Wrangler asks you to log in if you have not already.
Without a `--branch` flag, the upload goes to production. Pass `--branch=<name>`
to create a preview deployment for another branch.

## Custom domains

In the Cloudflare dashboard, open the project, go to Custom domains, and add your
domain. If the domain uses Cloudflare DNS, Cloudflare creates the record for you.
Otherwise, add the CNAME record it shows at your DNS provider.

## CI/CD with GitHub Actions

The sample below builds on every push to `main` and deploys with
[wrangler-action](https://github.com/cloudflare/wrangler-action).

### Set up the secrets

Add these under Settings, then Secrets and variables, then Actions, as repository
secrets:

- `CLOUDFLARE_API_TOKEN`: the API token from the step above.
- `CLOUDFLARE_ACCOUNT_ID`: your account ID.

### Sample workflow

Save this as `.github/workflows/deploy-cloudflare-pages.yml`. Change
`my-site` to your project name.

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-cloudflare-pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm

      - name: Install and build
        run: |
          pnpm install --frozen-lockfile
          pnpm build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v4
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/web/_site --project-name=my-site
          # Optional. Adds a deployment entry to the GitHub repository.
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### Settings to know

- `command` takes the same arguments as the manual `wrangler pages deploy`
  command. The folder must be the build output, `apps/web/_site`.
- `deployments: write` lets the optional `gitHubToken` create deployment entries.
  Remove both lines if you do not want them.
- The workflow runs on pushes to `main`. Pushes to other branches do not deploy
  to production. Add `branches` entries if you want preview deployments from
  other branches.
- `workflow_dispatch` lets you run the deploy from the Actions tab.
