import type UserConfig from '@11ty/eleventy/UserConfig';
import {loadSite, type SiteData} from './site.ts';

/** The collections a feed can include. */
const SECTIONS = ['posts', 'artworks'] as const;
export type FeedSection = (typeof SECTIONS)[number];

export interface Feed {
	/** Where the feed is published, e.g. /feed.xml. */
	url: string;
	/** Link text in the footer. */
	name: string;
	/** The feed's title in feed readers. */
	title: string;
	include: FeedSection[];
}

/** One feed with everything, for sites that don't set `feeds`. */
const DEFAULT: NonNullable<SiteData['feeds']> = [
	{url: '/feed.xml', include: [...SECTIONS]},
];

/** `feeds` from site.yml, with defaults filled in and checked. */
export function resolveFeeds(site: SiteData): Feed[] {
	return (site.feeds ?? DEFAULT).map((feed) => {
		const include = feed.include ?? [...SECTIONS];
		const unknown = include.filter((s) => !SECTIONS.includes(s));
		if (!feed.url || unknown.length) {
			throw new Error(
				`[feeds] Each feed in site.yml needs a url, and include can only list ${SECTIONS.join(' and ')}. Got: ${JSON.stringify(feed)}`,
			);
		}
		return {
			url: feed.url,
			name: feed.name ?? 'Feed',
			title: feed.title ?? site.title,
			include,
		};
	});
}

/**
 * Makes `feeds` available to every template: src/feed.xml.11ty.ts renders one
 * file per feed, and the head and footer link to each one.
 */
export function feeds(eleventyConfig: UserConfig) {
	// A function, so changes to site.yml are picked up on rebuild.
	eleventyConfig.addGlobalData('feeds', () => resolveFeeds(loadSite()));
}
