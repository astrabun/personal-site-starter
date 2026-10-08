import type UserConfig from '@11ty/eleventy/UserConfig';
import {feedPlugin} from '@11ty/eleventy-plugin-rss';
import {ogImages} from '@site/brand/eleventy';
import {parse as parseYaml} from 'yaml';
import {drafts} from './config/drafts.ts';
import {filters} from './config/filters.ts';
import {seo} from './config/seo.ts';
import {loadSite} from './config/site.ts';

export default function (eleventyConfig: UserConfig) {
	const site = loadSite();

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
	eleventyConfig.addPlugin(seo);
	// Renders a social image for pages with `autoOgImage: true` (see config/seo.ts).
	eleventyConfig.addPlugin(ogImages);

	eleventyConfig.addPlugin(feedPlugin, {
		type: 'atom',
		outputPath: '/feed.xml',
		collection: {name: 'posts', limit: 20},
		metadata: {
			language: site.language,
			title: site.title,
			subtitle: site.description,
			base: site.url,
			author: {name: site.author.name},
		},
	});

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
