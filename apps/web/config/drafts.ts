import type UserConfig from '@11ty/eleventy/UserConfig';

/**
 * Anything with `draft: true` in its front matter is rendered while running
 * `pnpm dev` (with a "[Draft]" title prefix) and skipped entirely by `pnpm build`.
 */
export function drafts(eleventyConfig: UserConfig) {
	eleventyConfig.addPreprocessor(
		'drafts',
		'*',
		(data: {draft?: boolean; title?: string; page: {fileSlug: string}}) => {
			if (!data.draft) {
				return undefined;
			}
			if (process.env.ELEVENTY_RUN_MODE === 'build') {
				return false;
			}
			data.title = `[Draft] ${data.title ?? data.page.fileSlug}`;
			return undefined;
		},
	);
}
