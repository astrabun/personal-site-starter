# Deploying your site

The site builds to static files in `apps/web/_site/`. Any static host can serve
that folder. This guide covers three hosts, each with a manual method and a CI/CD
method:

- [Neocities](deployment-neocities.md)
- [Cloudflare Pages](deployment-cloudflare-pages.md)
- [GitHub Pages](deployment-github-pages.md)

Each guide includes a sample workflow for GitHub Actions. Forgejo Actions reads the
same workflow syntax, so you can use the samples there too. See
[Forgejo Actions](#forgejo-actions) below.

## Before you deploy

Every host needs the same build output, so run the build once to check it works.
You need Node.js 24 (see `.nvmrc`) and pnpm.

```sh
pnpm install
pnpm build
```

The build writes the site to `apps/web/_site/`. Check that folder for an
`index.html` and a `feed.xml`.

Set `url` in `apps/web/src/_data/site.yml` to your real domain before you
deploy. Canonical URLs, feeds, and the sitemap use that value. Use the address
people will visit, without a trailing slash.

## Choosing a host

| Host                                               | Cost                            | Custom domain | Notes                                                       |
| -------------------------------------------------- | ------------------------------- | ------------- | ----------------------------------------------------------- |
| [Neocities](deployment-neocities.md)               | Free tier, paid supporter plans | Yes           | Simple file hosting. Some file types need a paid account.   |
| [Cloudflare Pages](deployment-cloudflare-pages.md) | Free tier                       | Yes           | Served from a global CDN. Wrangler CLI handles uploads.     |
| [GitHub Pages](deployment-github-pages.md)         | Free for public repositories    | Yes           | Built into GitHub. Works best with a user or custom domain. |

Prices and limits change. Check each provider before you rely on a free tier.

## Manual or CI/CD

Manual deploys upload the built folder from your computer. Use them for a first
test or when you need a one-off update.

CI/CD deploys run on every push to `main`. A workflow file in your repository
checks out the code, builds the site, and uploads the result. Use CI/CD when you
want publishing to happen with a `git push` and nothing else.

Keep secrets such as API tokens in the repository's secret store. Never commit
them to the repository.

## Forgejo Actions

Forgejo runs workflows from `.forgejo/workflows/` or `.github/workflows/`. The
sample workflows work on Forgejo with two changes:

1. Put the file in `.forgejo/workflows/`, or keep it in `.github/workflows/`.
2. Store secrets under the repository's Settings, then Actions, then Secrets.

The Neocities and Cloudflare actions are ordinary JavaScript actions, so they
should run on Forgejo. GitHub Pages depends on GitHub's hosting service, so it
does not work on Forgejo. None of the workflows here have been tested on Forgejo.
Check the first run's logs.
