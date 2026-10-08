import type UserConfig from '@11ty/eleventy/UserConfig';

const WORDS_PER_MINUTE = 230;

export function filters(eleventyConfig: UserConfig) {
	/** `{{ date | readableDate }}` --> "October 7, 2026" */
	eleventyConfig.addFilter('readableDate', (date: Date) =>
		new Intl.DateTimeFormat('en-US', {
			dateStyle: 'long',
			timeZone: 'UTC',
		}).format(date),
	);

	/** `{{ date | isoDate }}` --> "2026-10-07", for <time datetime> */
	eleventyConfig.addFilter(
		'isoDate',
		(date: Date) => date.toISOString().split('T')[0],
	);

	/** `{{ date | datePath }}` --> "2026/10/07", for permalinks */
	eleventyConfig.addFilter('datePath', (date: Date) =>
		date.toISOString().slice(0, 10).replaceAll('-', '/'),
	);

	/** `{{ content | readingTime }}` --> "4 min read" */
	eleventyConfig.addFilter('readingTime', (content: unknown) => {
		const text = typeof content === 'string' ? content : '';
		const words = text
			.replace(/<[^>]*>/g, ' ')
			.split(/\s+/)
			.filter(Boolean).length;
		return `${Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))} min read`;
	});

	/** `{{ page.url | absoluteUrl: site.url }}` --> "https://example.com/about/" */
	eleventyConfig.addFilter(
		'absoluteUrl',
		(url: string, base: string) => new URL(url, base).href,
	);

	/** `{{ collections.posts | newestFirst | limit: 5 }}` */
	eleventyConfig.addFilter('newestFirst', (items: unknown[]) =>
		items.toReversed(),
	);
	eleventyConfig.addFilter('limit', <T>(items: T[], n: number) =>
		items.slice(0, n),
	);
}
