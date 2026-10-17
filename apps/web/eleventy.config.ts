import type UserConfig from '@11ty/eleventy/UserConfig';
import {ogImages} from '@site/brand/eleventy';
import {parse as parseYaml} from 'yaml';
import {drafts} from './config/drafts.ts';
import {feeds} from './config/feeds.ts';
import {filters} from './config/filters.ts';
import {gallery} from './config/gallery.ts';
import {seo} from './config/seo.ts';

export default function (eleventyConfig: UserConfig) {
	// Let `*.11ty.ts` files act as JavaScript templates (see src/sitemap.xml.11ty.ts).
	eleventyConfig.addExtension('11ty.ts', {key: '11ty.js'});
	eleventyConfig.addTemplateFormats('11ty.ts');

	// Allow `.yml` / `.yaml` files in src/_data.
	eleventyConfig.addDataExtension('yml,yaml', (contents: string) =>
		parseYaml(contents),
	);

	eleventyConfig.addPassthroughCopy('src/assets');
	// Files in src/static are copied to the site root (favicon.ico, etc).
	eleventyConfig.addPassthroughCopy({'src/static': '/'});

	eleventyConfig.addPlugin(drafts);
	eleventyConfig.addPlugin(filters);
	// Artworks in src/gallery/ and their optimized images (see config/gallery.ts).
	eleventyConfig.addPlugin(gallery);
	eleventyConfig.addPlugin(seo);
	// Atom feeds, set under `feeds` in site.yml (see config/feeds.ts).
	eleventyConfig.addPlugin(feeds);
	// Renders a social image for pages with `autoOgImage: true` (see config/seo.ts).
	eleventyConfig.addPlugin(ogImages);

	return {
		dir: {
			input: 'src',
			output: '_site',
			data: '_data',
			includes: '_includes',
			layouts: '_layouts',
		},
		markdownTemplateEngine: 'liquid',
		htmlTemplateEngine: 'liquid',
	};
}
