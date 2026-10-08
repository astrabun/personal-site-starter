import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {loadConfig} from './config.ts';
import {hostOf, ogImageUrl, renderOgImage, type OgContent} from './og.ts';

export {ogImageUrl};

interface CollectionItem {
	url: string | false;
	date: Date;
	data: {
		title?: string;
		description?: string;
		image?: string;
		tags?: string[];
		autoOgImage?: boolean;
	};
}

interface EleventyConfig {
	addCollection(
		name: string,
		callback: (api: {getAll(): CollectionItem[]}) => unknown,
	): void;
	on(
		event: 'eleventy.after',
		callback: (event: {dir: {output: string}}) => Promise<void>,
	): void;
}

export interface OgImagesOptions {
	/** Rendered images are kept here so unchanged pages aren't re-rendered. */
	cacheDir?: string;
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'long',
	timeZone: 'UTC',
});

/**
 * Generates a social sharing image for every page with `autoOgImage: true` (and
 * no `image` of its own). Pair with `ogImageUrl()` so the page's meta tags
 * point at the generated file.
 */
export function ogImages(
	eleventyConfig: EleventyConfig,
	options: OgImagesOptions = {},
) {
	const cacheDir = resolve(options.cacheDir ?? '.cache/og-images');
	let pending: {url: string; content: OgContent}[] = [];

	// Collections are rebuilt on every build, which makes this a convenient place
	// to find the pages that need an image.
	eleventyConfig.addCollection('_autoOgImages', (api) => {
		const config = loadConfig();
		pending = api
			.getAll()
			.filter((item) => item.url && item.data.autoOgImage && !item.data.image)
			.map((item) => {
				const isPost = item.data.tags?.includes('posts') ?? false;
				return {
					url: ogImageUrl(item.url as string),
					content: {
						eyebrow: config.site.title,
						title: item.data.title ?? config.site.title,
						subtitle: isPost
							? dateFormat.format(item.date)
							: (item.data.description ?? hostOf(config.site.url)),
					},
				};
			});
		return [];
	});

	eleventyConfig.on('eleventy.after', async ({dir}) => {
		if (pending.length === 0) return;
		const config = loadConfig();
		mkdirSync(cacheDir, {recursive: true});

		await Promise.all(
			pending.map(async ({url, content}) => {
				const key = createHash('sha256')
					.update(
						JSON.stringify([
							content,
							config.colors,
							config.mark,
							config.initials,
						]),
					)
					.digest('hex')
					.slice(0, 16);
				const cached = join(cacheDir, `${key}.png`);
				if (!existsSync(cached)) {
					writeFileSync(cached, await renderOgImage(config, content));
				}
				const out = join(dir.output, url);
				mkdirSync(dirname(out), {recursive: true});
				copyFileSync(cached, out);
			}),
		);
		console.log(`[brand] Wrote ${pending.length} social image(s)`);
	});
}
