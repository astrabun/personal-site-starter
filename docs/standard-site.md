# Publishing to standard.site (optional)

[standard.site](https://standard.site) is a set of AT Protocol record types
for websites and the posts on them. If you publish those records to your
Bluesky (or other AT Protocol) account, apps that understand them can show a
link to your site as a post from your publication instead of a plain link card.

The starter includes a sync command that does this for you. It is off by
default. Nothing is published until you turn it on and add credentials.

## What gets published

`pnpm sync:standard-site` writes these records to your account:

- One `site.standard.publication` record for the site, with its URL, title,
  description, and an icon.
- One `site.standard.document` record for each published post, with its path,
  title, description, tags, and dates. Drafts are skipped.

It then saves the records' addresses (AT-URIs) to
`apps/web/src/_data/standardSite.json`. When that file exists, the build adds:

- `<link rel="site.standard.publication">` to every page, and
  `<link rel="site.standard.document">` to each synced post.
- `/.well-known/site.standard.publication`, which proves your domain owns the
  publication.

Running the sync again updates the existing records rather than creating
duplicates. If you delete a post, unpublish it, or change its URL, the sync
deletes its old document record. Records from other standard.site apps on the
same account, such as a Leaflet publication, are never touched.

## Prerequisites

- **An AT Protocol account.** A Bluesky account. If your account is
  hosted on your own or another provider's server (PDS), note its URL. You'll
  need it for `ATPROTO_SERVICE`.
- **An app password.** In Bluesky, go to Settings, then Privacy and security,
  then App passwords, and create one. Use it in place of your real password. You
  can revoke it at any time.
- **Your real domain in `site.yml`.** Set `url` in `apps/web/src/_data/site.yml`
  before you sync. The publication record and every document path are tied to it.

## Turn it on

In `apps/web/src/_data/site.yml`:

```yaml
standardSite:
  enabled: true
  # icon: src/static/apple-touch-icon.png
  # showInDiscover: true
```

- `icon` is the publication's icon, relative to `apps/web`. It must be a square
  PNG, JPEG, or WebP image under 1 MB. The default is the icon that
  `pnpm brand icons` generates.
- `showInDiscover: false` asks standard.site apps not to list your publication
  in their discovery feeds.

## Set the credentials

The sync reads three environment variables:

| Variable               | Required | Value                                                                  |
| ---------------------- | -------- | ---------------------------------------------------------------------- |
| `ATPROTO_HANDLE`       | Yes      | Your handle, e.g. `you.bsky.social` or `example.com`                   |
| `ATPROTO_APP_PASSWORD` | Yes      | The app password you created                                           |
| `ATPROTO_SERVICE`      | No       | Your PDS URL, if not hosted by Bluesky. Default: `https://bsky.social` |

Never commit these values. Keep them in a local `.env` file and your CI
provider's secret store, as described below. (and .gitignore your .env!!!)

### On your computer

Copy the example file and fill it in:

```sh
cp apps/web/.env.example apps/web/.env
```

`.env` is in `.gitignore`. You can also export the variables in your shell
instead. Then run the sync from the repository root:

```sh
pnpm sync:standard-site --dry-run   # log in and show what would change
pnpm sync:standard-site             # publish
```

Commit the `apps/web/src/_data/standardSite.json` file the sync writes. Then
local builds and CI builds include the link tags, even if a later sync fails.

Run the sync again whenever you publish, edit, or remove a post. Or let CI do
it on every deploy, as described below.

### In GitHub Actions

Add the credentials to your repository under Settings, then Secrets and
variables, then Actions:

- On the **Secrets** tab, add `ATPROTO_HANDLE` and `ATPROTO_APP_PASSWORD`.
- If your account isn't hosted by Bluesky, add `ATPROTO_SERVICE` on the
  **Variables** tab. It isn't secret.

Then add this step to your deploy workflow, after `pnpm install` and before
`pnpm build`. Any of the samples in [deployment.md](deployment.md) will work:

```yaml
- name: Sync standard.site records
  if: github.ref == 'refs/heads/main'
  continue-on-error: true
  env:
    ATPROTO_HANDLE: ${{ secrets.ATPROTO_HANDLE }}
    ATPROTO_APP_PASSWORD: ${{ secrets.ATPROTO_APP_PASSWORD }}
    ATPROTO_SERVICE: ${{ vars.ATPROTO_SERVICE }}
  run: pnpm sync:standard-site
```

For example, in the GitHub Pages workflow, split the "Install and build" step:

```yaml
- name: Install
  run: pnpm install --frozen-lockfile

- name: Sync standard.site records
  if: github.ref == 'refs/heads/main'
  continue-on-error: true
  env:
    ATPROTO_HANDLE: ${{ secrets.ATPROTO_HANDLE }}
    ATPROTO_APP_PASSWORD: ${{ secrets.ATPROTO_APP_PASSWORD }}
    ATPROTO_SERVICE: ${{ vars.ATPROTO_SERVICE }}
  run: pnpm sync:standard-site

- name: Build
  run: pnpm build
```

About this step:

- It runs before the build, so the build uses the record addresses from this
  sync.
- The sync only changes the copy of `standardSite.json` inside the CI run. The
  updated file isn't committed back, and it doesn't need to be. Records are
  matched by post path, so the next run finds them again instead of creating
  duplicates. Commit the file from your computer now and then so local builds
  show new posts' tags.
- `continue-on-error: true` keeps a sync failure, such as an expired app
  password or a PDS outage, from blocking a deploy. The site then builds with
  the committed `standardSite.json`. Remove the line if you'd rather fail the
  deploy.
- `if: github.ref == 'refs/heads/main'` keeps pull requests and other branches
  from publishing records. If `standardSite.enabled` is `false`, the step prints
  a message and succeeds, so it is safe to add before you set anything up.

### In Forgejo Actions

The same step works. Add the secrets under the repository's Settings, then
Actions, then Secrets, and `ATPROTO_SERVICE` under Variables. See
[Forgejo Actions](deployment.md#forgejo-actions) for the other differences.

### Other CI providers

Set `ATPROTO_HANDLE` and `ATPROTO_APP_PASSWORD` as secret environment
variables in your provider's settings, then run `pnpm sync:standard-site`
between `pnpm install` and `pnpm build`.

## Check that it worked

- Open `https://<your-domain>/.well-known/site.standard.publication` after you
  deploy. It should contain an `at://` address.
- View the source of a post and look for `<link rel="site.standard.document">`.
- Browse your records on [pdsls.dev](https://pdsls.dev). Search for your
  handle and open the `site.standard.publication` and `site.standard.document`
  collections.
- Share a link to a post on Bluesky and check the preview.

## Customizing

The sync lives in `apps/web/scripts/sync-standard-site.ts`.

- **Post URLs.** The sync builds each post's path (`/posts/YYYY/MM/DD/slug/`)
  the same way `permalink` in `apps/web/src/blog/blog.11tydata.json` does. If
  you change one, change the other. A post whose front matter sets a plain
  `permalink` uses that instead.
- **Syncing pages as well as posts.** Add entries to the `documents` list in
  `main()`. The build looks up each page's document by its URL, so any `path`
  you sync gets its link tag automatically.
- **Turning it off.** Set `enabled: false`. The existing records stay on your
  account. Delete them on [pdsls.dev](https://pdsls.dev) if you want them gone.
  Then delete `standardSite.json` to remove the link tags.
