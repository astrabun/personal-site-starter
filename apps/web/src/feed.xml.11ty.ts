import {
	convertHtmlToAbsoluteUrls,
	dateToRfc3339,
} from '@11ty/eleventy-plugin-rss';
import type {Feed} from '../config/feeds.ts';
import {shareImage, type ArtworkData} from '../config/gallery.ts';
import type {SiteData} from '../config/site.ts';

interface CollectionItem {
	url: string | false;
	date: Date;
	content: string;
	data: ArtworkData & {title?: string; description?: string};
}

interface Data {
	site: SiteData;
	feed: Feed;
	collections: {posts?: CollectionItem[]; artworks?: CollectionItem[]};
}

const LIMIT = 20;

// One file per feed listed under `feeds` in site.yml (see config/feeds.ts).
export const data = {
	pagination: {data: 'feeds', size: 1, alias: 'feed'},
	permalink: ({feed}: {feed: Feed}) => feed.url,
	eleventyExcludeFromCollections: true,
	// Render after posts and artworks, so their content is ready.
	eleventyImport: {collections: ['posts', 'artworks']},
};

const escape = (text: string) =>
	text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');

/** An entry's HTML. Artworks get their image first, since it isn't part of their content. */
async function entryHtml(item: CollectionItem, base: string): Promise<string> {
	let html = item.content;
	if (item.data.tags?.includes('artworks')) {
		const image = await shareImage(item.data);
		const description = item.data.description
			? `<p>${escape(item.data.description)}</p>`
			: '';
		html = `<p><img src="${image.url}" alt="${escape(image.alt)}" width="${image.width}" height="${image.height}"></p>${description}${html}`;
	}
	return convertHtmlToAbsoluteUrls(html, base);
}

export async function render({site, feed, collections}: Data): Promise<string> {
	const items = feed.include
		.flatMap((section) => collections[section] ?? [])
		.filter((item): item is CollectionItem & {url: string} => Boolean(item.url))
		.toSorted((a, b) => b.date.getTime() - a.date.getTime())
		.slice(0, LIMIT);
	const home = new URL('/', site.url).href;
	const self = new URL(feed.url, site.url).href;

	const entries = await Promise.all(
		items.map(async (item) => {
			const url = new URL(item.url, site.url).href;
			return `	<entry>
		<title>${escape(item.data.title ?? '')}</title>
		<link href="${url}" />
		<updated>${dateToRfc3339(item.date)}</updated>
		<id>${url}</id>
		<content type="html">${escape(await entryHtml(item, url))}</content>
	</entry>`;
		}),
	);

	return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${site.language}">
	<title>${escape(feed.title)}</title>
	<subtitle>${escape(site.description)}</subtitle>
	<link href="${self}" rel="self" />
	<link href="${home}" />
	<updated>${dateToRfc3339(items[0]?.date ?? new Date())}</updated>
	<id>${self}</id>
	<author>
		<name>${escape(site.author.name)}</name>
	</author>
${entries.join('\n')}
</feed>
`;
}
