import type UserConfig from '@11ty/eleventy/UserConfig';
import {ogImageUrl} from '@site/brand/eleventy';
import type {SiteData} from './site.ts';

/** Front matter fields that affect SEO, plus the Eleventy data they're computed from. */
interface PageData {
	site: SiteData;
	page: {url: string | false; date: Date};
	title?: string;
	description?: string;
	/** Social sharing image for this page; a path like /assets/images/x.png or a full URL. */
	image?: string;
	imageAlt?: string;
	/** Generate a social image from the title at build time, unless `image` is set. */
	autoOgImage?: boolean;
	/** For posts: when the post was last meaningfully changed. */
	updated?: string | Date;
	tags?: string[];
	/** Ask search engines not to index this page. */
	noindex?: boolean;
}

export interface Seo {
	title: string;
	description: string;
	url: string;
	type: 'website' | 'article';
	locale: string;
	noindex: boolean;
	image?: {url: string; alt: string; width?: number; height?: number};
	twitterCard: 'summary' | 'summary_large_image';
	article?: {published: string; modified?: string; tags: string[]};
	/** JSON-LD structured data, safe to place inside a <script> tag. */
	jsonLd: string;
}

const isoString = (date: string | Date) => new Date(date).toISOString();

export function computeSeo(data: PageData): Seo {
	const {site, page} = data;
	const url = new URL(page.url || '/', site.url).href;
	const isHome = page.url === '/';
	const isPost = data.tags?.includes('posts') ?? false;
	const title = isHome || !data.title ? site.title : data.title;
	const description = data.description ?? site.description;

	let image: Seo['image'];
	if (data.image) {
		image = {
			url: new URL(data.image, site.url).href,
			alt: data.imageAlt ?? '',
		};
	} else if (data.autoOgImage && page.url) {
		image = {
			url: new URL(ogImageUrl(page.url), site.url).href,
			alt: title,
			width: 1200,
			height: 630,
		};
	} else if (site.image) {
		image = {...site.image, url: new URL(site.image.url, site.url).href};
	}

	const article = isPost
		? {
				published: page.date.toISOString(),
				...(data.updated ? {modified: isoString(data.updated)} : {}),
				tags: (data.tags ?? []).filter((tag) => tag !== 'posts'),
			}
		: undefined;

	const person = {
		'@type': 'Person',
		name: site.author.name,
		url: site.author.url ?? site.url,
		...(site.author.links?.length ? {sameAs: site.author.links} : {}),
	};

	let schema: Record<string, unknown>;
	if (article) {
		schema = {
			'@type': 'BlogPosting',
			headline: title,
			description,
			url,
			mainEntityOfPage: url,
			datePublished: article.published,
			dateModified: article.modified ?? article.published,
			author: person,
			...(image && {image: image.url}),
			...(article.tags.length ? {keywords: article.tags} : {}),
		};
	} else if (isHome) {
		schema = {
			'@type': 'WebSite',
			name: site.title,
			description,
			url,
			inLanguage: site.language,
			author: person,
		};
	} else {
		schema = {'@type': 'WebPage', name: title, description, url};
	}

	return {
		title,
		description,
		url,
		type: article ? 'article' : 'website',
		locale: site.locale,
		noindex: data.noindex ?? false,
		...(image && {image}),
		twitterCard: image ? 'summary_large_image' : 'summary',
		...(article && {article}),
		// Escape `<` so a stray "</script>" in a title can't end the script tag.
		jsonLd: JSON.stringify({
			'@context': 'https://schema.org',
			...schema,
		}).replaceAll('<', '\\u003c'),
	};
}

/** Makes a computed `seo` object available to every template (see _includes/seo.liquid). */
export function seo(eleventyConfig: UserConfig) {
	eleventyConfig.addGlobalData('eleventyComputed', {
		seo: (data: PageData) => computeSeo(data),
	});
}
