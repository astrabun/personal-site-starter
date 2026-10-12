import type {StandardSiteData} from '../config/seo.ts';

interface Data {
	standardSite?: StandardSiteData;
}

/**
 * /.well-known/site.standard.publication: the publication's AT-URI, which lets
 * standard.site apps verify that this domain owns the publication. Written only
 * after `pnpm sync:standard-site` has run (see docs/standard-site.md).
 */
export const data = {
	permalink: ({standardSite}: Data) =>
		standardSite ? '/.well-known/site.standard.publication' : false,
	eleventyExcludeFromCollections: true,
};

export function render({standardSite}: Data): string {
	return `${standardSite?.publication ?? ''}\n`;
}
