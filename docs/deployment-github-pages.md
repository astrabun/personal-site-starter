# Deploying to GitHub Pages

[GitHub Pages](https://pages.github.com) hosts static sites from a GitHub
repository. GitHub Pages deploys through GitHub Actions by default. The sample
workflow below uses the official Pages actions.

Back to [deployment overview](deployment.md).

## Choose an address

GitHub Pages gives each repository a site at one of two addresses:

- `https://<user>.github.io` for a user site, if the repository is named
  `<user>.github.io`. This site serves from the root of the domain.
- `https://<user>.github.io/<repo>/` for a project site. This site serves from a
  subfolder.

This starter does not support subfolder URLs. Its links point at the site root,
so pages break under a subfolder. Use one of these:

- A user site, named `<user>.github.io`.
- A custom domain on any repository. Add the domain under Settings, then Pages.
  GitHub asks you to create a DNS record. Add a `CNAME` file to
  `apps/web/src/static/`, containing only your domain name, so the build
  copies it to the site root.

Set `url` in `apps/web/src/_data/site.yml` to the address you chose, without
a trailing slash.

## Enable Pages

Go to Settings, then Pages. Under Build and deployment, set Source to
GitHub Actions. The workflow below creates the site, so you do not pick a branch.

## Manual deploy

GitHub Pages can serve a branch as well as the Actions output. To publish the
build by hand, push the output folder to a `gh-pages` branch:

1. Build the site with `pnpm build`.
2. Run the `gh-pages` package against the output folder:

   ```sh
   pnpm dlx gh-pages -d apps/web/_site
   ```

3. In Settings, then Pages, set Source to Deploy from a branch. Choose the
   `gh-pages` branch and the root folder.

Use this method only for a one-off publish. Before you use the workflow below,
set Source back to GitHub Actions. Otherwise the two methods overwrite each other.

## CI/CD with GitHub Actions

The sample below builds on every push to `main`. It uses GitHub's
[configure-pages](https://github.com/actions/configure-pages),
[upload-pages-artifact](https://github.com/actions/upload-pages-artifact), and
[deploy-pages](https://github.com/actions/deploy-pages) actions.

The workflow needs no secrets. The `GITHUB_TOKEN` that GitHub provides for each
run is enough.

### Sample workflow

Save this as `.github/workflows/deploy-github-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
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

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload the site
        uses: actions/upload-pages-artifact@v4
        with:
          path: apps/web/_site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Settings to know

- The `build` and `deploy` jobs are separate. The `deploy` job runs only after the
  build succeeds.
- `pages: write` and `id-token: write` let the deploy job publish the site.
- `concurrency` with `cancel-in-progress: false` finishes a running deploy before
  it starts the next. Cancelling a Pages deploy partway can leave the site in an
  unclear state.
- The first run asks you to approve the `github-pages` environment if you have
  required reviewers set. Otherwise it runs without a pause.

Check the action versions against the repositories linked above before you copy
the sample. The majors shown are the ones current when this guide was written.
