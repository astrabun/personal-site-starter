// Eleventy doesn't ship TypeScript declarations (yet?). This covers the parts of
// the config API used in this project; extend it as you reach for more.

declare module '@11ty/eleventy/UserConfig' {
	type Plugin = (eleventyConfig: UserConfig, options?: any) => void;

	export default interface UserConfig {
		addPlugin(plugin: Plugin, options?: Record<string, unknown>): void;
		addFilter(name: string, filter: (...args: any[]) => unknown): void;
		addShortcode(
			name: string,
			shortcode: (...args: any[]) => string | Promise<string>,
		): void;
		addPairedShortcode(
			name: string,
			shortcode: (content: string, ...args: any[]) => string,
		): void;
		addCollection(
			name: string,
			callback: (collectionApi: any) => unknown,
		): void;
		addGlobalData(name: string, data: unknown): void;
		addPassthroughCopy(path: string | Record<string, string>): void;
		addTemplateFormats(formats: string | string[]): void;
		addExtension(
			extensions: string | string[],
			options: Record<string, unknown>,
		): void;
		addDataExtension(
			extensions: string,
			parser: (contents: string, filePath: string) => unknown,
		): void;
		addPreprocessor(
			name: string,
			extensions: string,
			callback: (data: any, content: string) => unknown,
		): void;
		addWatchTarget(path: string): void;
		on(event: string, callback: (...args: any[]) => unknown): void;
		setLibrary(engine: string, library: unknown): void;
		ignores: Set<string>;
	}
}

declare module '@11ty/eleventy-plugin-rss' {
	import type UserConfig from '@11ty/eleventy/UserConfig';

	export function feedPlugin(
		eleventyConfig: UserConfig,
		options?: Record<string, unknown>,
	): void;
	export function dateToRfc3339(date: Date): string;
	export function convertHtmlToAbsoluteUrls(
		html: string,
		base: string,
	): Promise<string>;
}

declare module '@11ty/eleventy-img' {
	export interface ImageResult {
		url: string;
		width: number;
		height: number;
		format: string;
	}
	export type ImageMetadata = Record<string, ImageResult[]>;

	export default function eleventyImage(
		src: string,
		options?: Record<string, unknown>,
	): Promise<ImageMetadata>;
	export function generateHTML(
		metadata: ImageMetadata,
		attributes: Record<string, string>,
	): string;
}
