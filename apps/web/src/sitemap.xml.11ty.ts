interface CollectionItem {
	url: string | false;
	date: Date;
}

interface Data {
	site: {url: string};
	collections: {all: CollectionItem[]};
}

export const data = {
	permalink: '/sitemap.xml',
	eleventyExcludeFromCollections: true,
};

export function render({site, collections}: Data): string {
	const urls = collections.all
		// Only HTML pages (`/about/`, `/posts/2026/10/07/hello-world/`), not feeds or robots.txt.
		.filter((item): item is CollectionItem & {url: string} =>
			Boolean(item.url && item.url.endsWith('/')),
		)
		.map(
			(item) => `\t<url>
		<loc>${new URL(item.url, site.url).href}</loc>
		<lastmod>${item.date.toISOString()}</lastmod>
	</url>`,
		)
		.join('\n');

	return `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
