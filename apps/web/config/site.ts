import {readFileSync} from 'node:fs';
import {parse as parseYaml} from 'yaml';

/** The shape of src/_data/site.yml. */
export interface SiteData {
	title: string;
	description: string;
	url: string;
	language: string;
	/** Open Graph locale, e.g. "en_US". */
	locale: string;
	author: {
		name: string;
		url?: string;
		/** Your profiles elsewhere. Used for rel="me" links and structured data. */
		links?: string[];
	};
	/** Default social sharing image, used when a page doesn't set `image`. */
	image?: {
		url: string;
		alt: string;
		width?: number;
		height?: number;
	};
}

/** Reads src/_data/site.yml for use outside of templates (feeds, sitemap, etc). */
export function loadSite(): SiteData {
	const data: unknown = parseYaml(
		readFileSync(new URL('../src/_data/site.yml', import.meta.url), 'utf8'),
	);
	return data as SiteData;
}
