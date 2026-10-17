# Personal Website Starter

A small, hackable starting point for a personal website, blog, and art gallery, built with
[Eleventy](https://www.11ty.dev/), TypeScript, and pnpm. I will keep yelling about how
I think everyone should have a personal website until I can't yell anymore, and
this is my way of saying "here, take this, get started!"

- Pages and blog posts written in Markdown, so writing content is _super easy_
- An art gallery: drop in your images, run one command to add titles and alt text, and
  get a gallery page, a page for each piece, and tag pages. Images are resized and
  stripped of camera and location data automatically.
- A base layout with a header, data-driven navigation, and footer
- Drafts you can preview locally that stay out of production builds
- Atom feeds for posts and artwork, together or separately, plus a sitemap and `robots.txt`
- SEO and social sharing tags (Open Graph, social cards, and JSON-LD structured data)
- Generated favicons and social sharing images in your own colors, including per-post images rendered at build time
- A `pnpm cms` command for creating, listing, and publishing posts, and adding artwork
- No client-side JavaScript and no CSS framework. One stylesheet includes light and dark themes.

## Getting started

You'll need Node.js and pnpm.

```sh
pnpm install
pnpm dev        # http://localhost:8080
```

Then make it yours:

1. Edit `apps/web/src/_data/site.yml` with your name, site title, and URL.
2. Edit the home page in `apps/web/src/index.md`.
3. Replace the sample posts in `apps/web/src/blog/` and the sample artwork in
   `apps/web/src/gallery/`. Only want one or the other? See
   [Gallery-only or blog-only sites](#gallery-only-or-blog-only-sites).
4. Set your colors under `brand` in `site.yml`, then run `pnpm brand all` to
   regenerate the favicons and default social image.

Feel free to change the CSS and layout as much as you like. This is just a starter.

## Make your own copy

You can start from this repository in one of three ways.

**Fork it.** Use the Fork button on your git host, then clone your fork:

```sh
git clone <your-fork-url> my-site
```

**Clone it and point the remote at your own repository.** Create an empty repository on
your host first (no README or license), then run:

```sh
git clone <repo-url> my-site
cd my-site
git remote rename origin upstream   # keeps a link to this starter so you can pull updates
git remote add origin <your-repo-url>
git push -u origin main
```

To pull future starter changes later, run `git pull upstream main`. If you don't want
the link, skip the rename and run `git remote set-url origin <your-repo-url>` instead.

**Start from the template without cloning.** This downloads the current starter from
GitHub into a new directory, with no git history:

```sh
pnpm dlx giget@latest gh:astrabun/personal-site-starter my-site
# or: npx giget@latest gh:astrabun/personal-site-starter my-site
cd my-site
git init -b main
pnpm install
```

Then commit, add your remote, and push as shown above.

**Or copy from a local clone.** If you already have this repository, this copies the
files without the git history and starts a fresh repository:

```sh
pnpm new-site ../my-site        # or: npm run new-site -- ../my-site
cd ../my-site
pnpm install
```

Then commit, add your remote, and push as shown above.

## Commands

Run these from the repository root.

| Command          | What it does                                    |
| ---------------- | ----------------------------------------------- |
| `pnpm dev`       | Start a local server that rebuilds on save      |
| `pnpm build`     | Build the site into `apps/web/_site/`           |
| `pnpm cms`       | Create, list, and publish posts; add artwork    |
| `pnpm brand`     | Generate favicons and social images (see below) |
| `pnpm typecheck` | Type-check every package                        |
| `pnpm clean`     | Delete the build output                         |
| `pnpm lint`      | Lint with oxlint (`pnpm lint:fix` to auto-fix)  |
| `pnpm fmt`       | Format with oxfmt (`pnpm fmt:check` to verify)  |
| `pnpm check`     | Type-check, lint, and check formatting          |

## Project layout

```
apps/
└── web/                      The website
    ├── eleventy.config.ts    Eleventy configuration
    ├── config/               Filters, SEO, drafts handling, and other config helpers
    ├── types/                Type declarations for Eleventy
    └── src/
        ├── _data/            site.yml (metadata) and navigation.yml
        ├── _layouts/         base --> page, base --> post, base --> artwork
        ├── _includes/        Partials: head, seo, header, nav, footer, post-list, artwork-grid
        ├── assets/           CSS and images (copied as-is to /assets/)
        ├── static/           Copied as-is to the site root: favicons and the like
        ├── blog/             Blog posts: YYYY-MM-DD-slug.md
        ├── gallery/          Artwork: an image plus a .md file with the same name
        ├── pages/            Standalone pages: about.md --> /about/
        ├── index.md          Home page
        ├── blog.md           Blog index at /posts/
        ├── gallery.md        Gallery index at /gallery/
        └── gallery-tags.liquid  One page per artwork tag at /gallery/tags/<tag>/
packages/
├── cms/                      The `pnpm cms` command-line tool
└── brand/                    The `pnpm brand` tool and social image build plugin
```

## Pages

Any Markdown file in `src/pages/` becomes a page at `/<filename>/` with the
`page` layout:

```md
---
title: Uses
description: The hardware and software I use every day.
---

Your content here.
```

To link it from the header, add it to `src/_data/navigation.yml`:

```yaml
- text: Uses
  url: /uses/
```

The current page's link gets `aria-current`. Section links, such as Blog,
stay highlighted on every page inside that section. Add `external: true` to an
item to open it in a new tab.

To give a page its own URL, set `permalink:` in its front matter. For a page
without the title heading, use `layout: base`.

## Blog posts

Posts live in `src/blog/` and are named `YYYY-MM-DD-slug.md`. Eleventy reads
the date from the filename, and the post is published at `/posts/YYYY/MM/DD/slug/`.
Front matter supports:

| Field         | Purpose                                                   |
| ------------- | --------------------------------------------------------- |
| `title`       | Post title                                                |
| `description` | Used for the meta description and link previews           |
| `tags`        | A list of tags, shown under the title                     |
| `image`       | Image used for link previews (`og:image`)                 |
| `imageAlt`    | Alt text for `image`                                      |
| `updated`     | Date of the last significant edit, e.g. `2026-10-09`      |
| `draft`       | If `true`, visible in `pnpm dev` but excluded from builds |

### The CMS

`pnpm cms` handles the file naming and front matter for you:

```sh
pnpm cms new                       # prompts for title, slug, tags, and more
pnpm cms new "Hello again" --tags life,notes --draft -y
pnpm cms list                      # every post, newest first
pnpm cms list --drafts
pnpm cms publish                   # choose a draft to publish
pnpm cms publish hello-again       # or pass its slug or filename
```

Publishing removes `draft: true` and, unless you pass `--keep-date`, moves the
post's date to today. Run `pnpm cms --help` for all options.

The CMS looks for posts in `src/blog` by default. To use a different folder,
set `"cms": { "postsDir": "..." }` in `apps/web/package.json`. Artwork is
added to `galleryDir` (default `src/gallery`). If you move it, also update
`GALLERY_DIR` in `apps/web/config/gallery.ts`; change `MAX_SIZE` there to allow larger images.

## Gallery

Each artwork in `src/gallery/` is an image plus a Markdown file with the same
name, and is published at `/gallery/<name>/`:

```
src/gallery/
├── art-piece-1.jpg
├── art-piece-1.md
├── art-piece-2.png
└── art-piece-2.md
```

### Adding artwork

Drag your images into `src/gallery/`, then run:

```sh
pnpm cms art
```

It finds every image that doesn't have a `.md` file yet and asks for its title,
alt text, date, and the other details below. Press Enter to skip any question
except the title, or type `skip` to leave an image for later. It also renames
the image to match the title, so `IMG_2034.JPG` becomes `harbor-sketch.jpg`.

You can also pass images from anywhere and they're copied in:

```sh
pnpm cms art ~/Pictures/harbor.jpg
pnpm cms art ~/Pictures/harbor.jpg -y --title "Harbor sketch" --alt "Gulls over the harbor" --tags ink
```

Writing the `.md` file by hand works just as well:

```md
---
title: Tide pools at dusk
date: 2026-10-12
alt: A deep blue sea under a purple-to-orange sky, with a setting sun.
description: A small study painted on location.
medium: Oil on canvas
dimensions: 24 × 36 in
tags: [landscapes, plein-air]
---

Anything here, below the front matter, is shown under the image: process
notes, an artist statement, where it was shown.
```

| Field         | Purpose                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| `title`       | Artwork title                                                            |
| `date`        | When it was made or published, e.g. `2026-10-12`. Sets the order.        |
| `alt`         | Describes the image for screen readers and when it can't load            |
| `description` | A sentence for link previews and search results                          |
| `medium`      | e.g. `Watercolor on paper`                                               |
| `dimensions`  | e.g. `24 × 36 in`                                                        |
| `tags`        | Series, media, or themes. Each tag gets a page at `/gallery/tags/<tag>/` |
| `details`     | Extra images: close-ups, process shots, the piece framed (see below)     |
| `file`        | The image, if its name doesn't match the `.md` file                      |
| `download`    | `true` or `false`: offer the original file for download (see below)      |
| `draft`       | If `true`, visible in `pnpm dev` but excluded from builds                |

The build warns about images without a `.md` file and artwork without alt text
or a date, and stops if a `.md` file's image is missing.

### Detail shots

Put the extra images in `src/gallery/` and list them under `details`:

```yaml
details:
  - file: tide-pools-detail.jpg
    alt: Close-up of the brushwork around the sun.
```

They're shown below the description on the artwork's page.

### Image sizes and privacy

Your images are never published as-is. At build time, each one is resized to
a few sizes, the largest 1280px on its longest side, in WebP, with JPEG as a fallback (PNG for art with
transparency, GIF for animations), and browsers download the smallest one that
looks sharp. Camera details and GPS location are removed; color profiles are
kept. Resized images go to `/img/`. The settings are in
`apps/web/config/gallery.ts`.

To let visitors download the untouched original, set this in `site.yml`:

```yaml
gallery:
  downloadOriginals: true
```

or set `download: true` on individual pieces. Originals are published exactly as
uploaded, including any camera or location data in the file, so strip it first
if that matters to you.

Thumbnails keep each piece's own proportions. To crop them all to one shape,
set `--thumb-ratio: 1 / 1` (or `4 / 5`, etc.) on `.artwork-grid` in `main.css`.

### Gallery-only or blog-only sites

The home page and feeds show whatever you have, so all you need to do is remove
the part you don't want (and, if you like, the feed you don't need; see
[Feeds](#feeds)):

- **Gallery only:** delete the posts in `src/blog/` and `src/blog.md`, and remove
  the Blog link from `src/_data/navigation.yml`.
- **Blog only:** delete the artwork in `src/gallery/` (keep
  `gallery.11tydata.json` if you might add some later) and `src/gallery.md`,
  and remove the Gallery link.

To make the gallery your home page, replace the contents of `src/index.md`
with the grid from `src/gallery.md`, and add `wide: true` to its front matter
for the wider layout.

## Feeds

The site publishes Atom feeds of the 20 newest items, as set under `feeds` in
`site.yml`. By default, there are two: everything, and just the gallery:

```yaml
feeds:
  - url: /feed.xml
    name: Feed # link text in the footer
    include: [posts, artworks]
  - url: /gallery/feed.xml
    name: Gallery feed
    title: My Website · Gallery # what feed readers show (default: site title)
    include: [artworks]
```

Each feed is linked in the footer and in every page's `<head>`, so feed readers
can find them. Artwork entries show the image, the description, and anything
written below the front matter.

- **One feed for everything:** delete the second feed.
- **Separate feeds for posts and artwork:** set the first feed's `include` to `[posts]`.
- **Keep artwork out of feeds:** delete the second feed and set the first
  feed's `include` to `[posts]`.

Without a `feeds` setting, the site publishes a single feed at `/feed.xml`
with both posts and artwork.

## SEO and social sharing

Every page gets a canonical URL, a meta description, Open Graph and social
card tags for link previews, and JSON-LD structured data for search engines.
Posts are marked up as articles, with published and modified dates and tags.
Artwork is marked up as a `VisualArtwork`, and uses the piece itself as its
link-preview image.

The tags are filled in automatically from `src/_data/site.yml` and each page's
front matter. Any page can set:

| Field         | Purpose                                                          |
| ------------- | ---------------------------------------------------------------- |
| `description` | Meta and link-preview description (default: site description)    |
| `image`       | Link-preview image (default: `site.image`)                       |
| `imageAlt`    | Alt text for `image`                                             |
| `autoOgImage` | If `true`, generate a link-preview image from the title at build |
| `noindex`     | If `true`, asks search engines not to index the page             |

In `site.yml`, set `url` to your real domain, since every absolute URL is built
from it. The following fields are also used:

- `image`: the default link-preview image. 1200×630 pixels works best.
- `author.links`: your profiles elsewhere. They become `rel="me"` links (for
  Mastodon verification and IndieAuth) and `sameAs` in the structured data.

The values are computed in `config/seo.ts` and rendered by
`src/_includes/seo.liquid`. To add a tag, add a field in one and print it in
the other.

## Favicons and social images

The `brand` package draws your logo mark, favicons, and social sharing images,
in the colors set under `brand` in `site.yml`:

```yaml
brand:
  background: '#171614' # social image background
  foreground: '#ebe7e0' # title text
  muted: '#9a948a' # secondary text
  accent: '#6e84f0' # logo tile and accent bar
  onAccent: '#ffffff' # the mark drawn on the tile
  mark: sun # or "initials"
  # initials: YN # defaults to the initials of author.name
```

### Images for each page, generated at build

Set `autoOgImage: true` in a page's front matter and the build renders a
1200×630 image with the site name, the page title, and the post date (or the
page's description). The page's link-preview tags point at it automatically.
Posts have it turned on for the whole folder in `src/blog/blog.11tydata.json`.
Add the same line to `src/pages/pages.11tydata.json` to turn it on for every
page.

A page's own `image` always takes priority. Rendered images are cached in
`apps/web/.cache/`, so only new or changed pages are rendered again.

### The command

```sh
pnpm brand all              # favicons + the default social image
pnpm brand icons            # favicon.svg, favicon.ico, apple-touch-icon.png
pnpm brand og               # src/assets/images/og-default.png
pnpm brand og about         # one page or post (by slug or path), saved to
                            # src/assets/images/og/ and set as its `image`
pnpm brand icons --accent "#2b59c3" --mark initials   # try colors for one run
```

Run `pnpm brand all` after changing the brand colors. To use your own artwork
instead, replace the files in `src/static/` and
`src/assets/images/og-default.png`. The icon links are in
`src/_includes/head.liquid`.

Images are laid out with [satori](https://github.com/vercel/satori) and
rendered with [resvg](https://github.com/yisibl/resvg-js), using the
[Inter](https://rsms.me/inter/) typeface. To change the design, edit
`packages/brand/src/og.ts`; it uses a flexbox-style element tree, much like
HTML with inline styles.

## Customizing

- Styles live in `src/assets/css/main.css`. Colors and fonts are CSS custom
  properties at the top of the file. If you change the colors, update `brand`
  in `site.yml` to match.
- Add filters in `config/filters.ts`. The starter includes `readableDate`,
  `isoDate`, `datePath`, `readingTime`, `absoluteUrl`, `newestFirst`, and `limit`.
- Files named `*.11ty.ts` render as templates. See `src/sitemap.xml.11ty.ts`
  for an example.
- Any `.yml` or `.json` file in `src/_data/` is available in templates under
  its filename.

TypeScript runs through Node's built-in type stripping, so there is no compile
step. Stick to syntax that can be erased: no `enum`s and no parameter
properties. `tsconfig.json` enforces this with `erasableSyntaxOnly`.

## Deploying

`pnpm build` writes a static site to `apps/web/_site/`. Any static host
works. Use `pnpm build` as the build command and `apps/web/_site` as the
output directory on Neocities, Cloudflare Pages, GitHub Pages, or others.

See [docs/deployment.md](docs/deployment.md) for manual and CI/CD setup on each
host, with sample GitHub Actions workflows.

## License

[MIT](LICENSE). The license covers this starter. Your own posts and pages are
yours to do whatever you want with.

If you want to credit me, feel free, but no pressure.
