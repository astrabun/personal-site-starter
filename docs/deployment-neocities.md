# Deploying to Neocities

[Neocities](https://neocities.org) hosts static sites for free. You can upload
files through its web editor or deploy from the command line or CI.

Back to [deployment overview](deployment.md).

## Before you start

1. Create an account at neocities.org. Your site address becomes
   `https://<sitename>.neocities.org`.
2. Set `url` in `apps/web/src/_data/site.yml` to that address, or to your
   custom domain if you use one.
3. Build the site with `pnpm build`.

Neocities hosts files only. It does not run a build, so you upload the output
of `pnpm build`, which is `apps/web/_site/`.

## Get your API key

Neocities uses an API key for command-line and CI uploads. Find it at:

```text
https://neocities.org/settings/<sitename>#api_key
```

Treat the key like a password. Anyone with it can change your site.

## Manual deploy

### Upload in the browser

1. Open your site's editor at `https://neocities.org/site/<sitename>`.
2. Drag the contents of `apps/web/_site/` into the file list. Upload the
   files inside the folder, not the folder itself, so `index.html` sits at the
   top level.

This works for small changes. It does not remove files you deleted locally.

### Upload with the CLI

The `neocities` npm package provides a command-line client. Install it, log in
with your API key, and push the build output:

```sh
pnpm dlx neocities login          # paste your API key when asked
pnpm dlx neocities push apps/web/_site
```

Check `neocities --help` for the current options if a command fails. The
`push` command uploads new and changed files. Remove files on the site with the
editor or the `delete` command.

## CI/CD with GitHub Actions

The sample below builds on every push to `main` and deploys with
[deploy-to-neocities](https://github.com/marketplace/actions/deploy-to-neocities).

### Set up the secret

1. Go to your repository's Settings, then Secrets and variables, then Actions.
2. Under Repository secrets, add a secret named `NEOCITIES_API_TOKEN`. Paste
   your Neocities API key as the value.

### Sample workflow

Save this as `.github/workflows/deploy-neocities.yml`:

```yaml
name: Deploy to Neocities

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-neocities
  cancel-in-progress: true

jobs:
  deploy:
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

      - name: Deploy to Neocities
        uses: bcomnes/deploy-to-neocities@v3
        with:
          api_key: ${{ secrets.NEOCITIES_API_TOKEN }}
          dist_dir: apps/web/_site
          cleanup: false
          preview_before_deploy: true
```

### Settings to know

- `dist_dir` points at the build output. Do not set it to the repository root.
  The root contains `.git` and source files.
- `cleanup: false` leaves remote files alone when they are missing locally. Set
  it to `true` only when you want Neocities to delete files that are no longer
  in the build. Test with `cleanup: false` first.
- `preview_before_deploy: true` prints the files to upload and delete before the
  upload starts. Check the log on your first run.
- `neocities_supporter` is not set in the sample. Neocities paid supporter
  accounts can upload file types that free accounts cannot. Set it to `true`
  on a supporter account if the upload rejects a file.
- `workflow_dispatch` lets you run the deploy from the Actions tab without a new
  commit.

The action's documentation for the full list of inputs is on its
[marketplace page](https://github.com/marketplace/actions/deploy-to-neocities).
