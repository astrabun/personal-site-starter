import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {basename, dirname, extname, join, relative, resolve} from 'node:path';
import type UserConfig from '@11ty/eleventy/UserConfig';
import eleventyImage, {generateHTML} from '@11ty/eleventy-img';
import sharp, {type Sharp} from 'sharp';
import {parse as parseYaml} from 'yaml';
import type {SiteData} from './site.ts';

/** File types that can be used as artwork. */
export const IMAGE_EXTENSIONS = [
	'.jpg',
	'.jpeg',
	'.png',
	'.webp',
	'.gif',
	'.avif',
	'.tif',
	'.tiff',
];

/** Front matter fields for an artwork in src/gallery/. */
export interface ArtworkData {
	page: {inputPath: string};
	site: SiteData;
	title?: string;
	alt?: string;
	/** The image, relative to the .md file. Defaults to the image with the same name. */
	file?: string;
	details?: {file: string; alt?: string}[];
	/** Offer the untouched original for download. Overrides site.gallery.downloadOriginals. */
	download?: boolean;
	tags?: string[];
}

interface CollectionItem {
	data: {tags?: string[]};
}

const GALLERY_DIR = 'src/gallery';

// Resized copies are written to <output>/img/. Set from Eleventy's output
// directory before each build.
let outputDir = '_site';
const imageOptions = () => ({
	urlPath: '/img/',
	outputDir: join(outputDir, 'img'),
});

const isImage = (file: string) =>
	IMAGE_EXTENSIONS.includes(extname(file).toLowerCase());

/**
 * The image an artwork's .md file points at: `file` if set, otherwise the
 * image next to it with the same name (sunset.md --> sunset.jpg).
 */
export function resolveArtworkFile(
	inputPath: string,
	file?: string,
): string | undefined {
	const dir = dirname(resolve(inputPath));
	if (file) {
		return resolve(dir, file);
	}
	const name = basename(inputPath, extname(inputPath)).toLowerCase();
	const match = readdirSync(dir).find(
		(f) => isImage(f) && basename(f, extname(f)).toLowerCase() === name,
	);
	return match ? join(dir, match) : undefined;
}

function requireFile(inputPath: string, file?: string): string {
	const path = resolveArtworkFile(inputPath, file);
	if (!path || !existsSync(path)) {
		const expected = file ?? `${basename(inputPath, extname(inputPath))}.jpg`;
		throw new Error(
			`[gallery] ${relative('.', inputPath)}: can't find the image "${expected}".`,
		);
	}
	return path;
}

/**
 * The longest side, in pixels, of any image published from the gallery.
 * Originals offered for download (see `download`) aren't resized.
 */
const MAX_SIZE = 1280;

/** What we need to know about a source image before resizing it. */
async function inspect(path: string) {
	const {
		width,
		height,
		pageHeight,
		orientation = 1,
		hasAlpha,
		pages = 1,
	} = await sharp(path).metadata();
	// Animated images report the height of all frames together.
	const frameHeight = pageHeight ?? height;
	// EXIF orientations 5-8 are turned 90°, so the image displays sideways from how it's stored.
	const [w, h] = orientation >= 5 ? [frameHeight, width] : [width, frameHeight];
	const scale = Math.min(1, MAX_SIZE / Math.max(w, h));
	return {hasAlpha, pages, maxWidth: Math.round(w * scale)};
}

/** A responsive <picture> for an artwork image, in several sizes and formats. */
export async function artworkPicture(
	inputPath: string,
	file: string | undefined,
	alt: string | undefined,
	sizes: string,
	loading: 'lazy' | 'eager' = 'lazy',
): Promise<string> {
	const path = requireFile(inputPath, file);
	// WebP for everyone, with a fallback that keeps transparency and animation.
	// Add 'avif' for smaller files, at the cost of slower builds.
	const {hasAlpha, pages, maxWidth} = await inspect(path);
	const fallback = pages > 1 ? 'gif' : hasAlpha ? 'png' : 'jpeg';
	// Smaller sizes for phones and thumbnails, skipping any too close to the largest.
	const widths = [480, 960].filter((w) => w * 1.25 <= maxWidth);
	const metadata = await eleventyImage(path, {
		...imageOptions(),
		widths: [...widths, maxWidth],
		formats: ['webp', fallback],
		sharpOptions: {animated: pages > 1},
	});
	return generateHTML(metadata, {
		alt: alt ?? '',
		sizes,
		loading,
		decoding: 'async',
	});
}

/** A single JPEG, up to 1200px wide, for link previews and the feed. */
export async function shareImage(
	data: ArtworkData,
): Promise<{url: string; width: number; height: number; alt: string}> {
	const path = requireFile(data.page.inputPath, data.file);
	const {maxWidth} = await inspect(path);
	const metadata = await eleventyImage(path, {
		...imageOptions(),
		widths: [Math.min(1200, maxWidth)],
		formats: ['jpeg'],
		// JPEG has no transparency; put transparent art on white instead of black.
		transform: (image: Sharp) => {
			image.flatten({background: '#ffffff'});
		},
	});
	const [image] = Object.values(metadata).flat();
	if (!image) {
		throw new Error(`[gallery] Couldn't process ${data.page.inputPath}.`);
	}
	return {
		url: image.url,
		width: image.width,
		height: image.height,
		alt: data.alt ?? data.title ?? '',
	};
}

/** URL of the untouched original file, copied into the build. */
async function originalUrl(inputPath: string, file?: string): Promise<string> {
	const metadata = await eleventyImage(requireFile(inputPath, file), {
		...imageOptions(),
		formats: ['passthrough'],
	});
	const [image] = Object.values(metadata).flat();
	return image?.url ?? '';
}

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

function readFrontMatter(
	path: string,
): Partial<ArtworkData> & {date?: unknown} {
	const match = FRONT_MATTER.exec(readFileSync(path, 'utf8'));
	const data: unknown = match ? parseYaml(match[1] ?? '') : undefined;
	return data ?? {};
}

/**
 * Checks src/gallery/ before each build: every .md needs its image, and every
 * image should have a .md. Missing images stop the build; missing alt text,
 * dates, or metadata are warnings.
 */
function checkGallery(dir: string) {
	if (!existsSync(dir)) return;
	const files = readdirSync(dir);
	const referenced = new Set<string>();
	const warnings: string[] = [];
	const errors: string[] = [];

	for (const md of files.filter((f) => f.endsWith('.md'))) {
		const path = join(dir, md);
		const data = readFrontMatter(path);
		const images = [
			{file: data.file, alt: data.alt, label: 'image'},
			...(data.details ?? []).map((d) => ({...d, label: `detail ${d.file}`})),
		];
		for (const {file, alt, label} of images) {
			const image = resolveArtworkFile(path, file);
			if (!image || !existsSync(image)) {
				errors.push(
					`${md}: can't find ${file ? `"${file}"` : 'a matching image'}`,
				);
				continue;
			}
			referenced.add(image);
			if (!alt) {
				warnings.push(`${md}: ${label} has no alt text`);
			}
		}
		if (!data.date) {
			warnings.push(`${md}: no date set`);
		}
	}

	for (const file of files.filter(isImage)) {
		if (!referenced.has(join(dir, file))) {
			warnings.push(
				`${file} has no .md file (run \`pnpm cms art\` to add one)`,
			);
		}
	}

	for (const warning of warnings) {
		console.warn(`[gallery] ${warning}`);
	}
	if (errors.length) {
		throw new Error(`[gallery]\n  ${errors.join('\n  ')}`);
	}
}

export function gallery(eleventyConfig: UserConfig) {
	const dir = resolve(GALLERY_DIR);

	eleventyConfig.on(
		'eleventy.before',
		({directories}: {directories: {output: string}}) => {
			outputDir = directories.output;
			checkGallery(dir);
		},
	);
	eleventyConfig.addWatchTarget(`${GALLERY_DIR}/`);

	/** `{% artworkImage page.inputPath, file, alt, "100vw" %}` --> <picture> */
	eleventyConfig.addShortcode('artworkImage', artworkPicture);

	/** `{% artworkOriginal page.inputPath, file %}` --> URL of the original file */
	eleventyConfig.addShortcode('artworkOriginal', originalUrl);

	/** Artworks grouped by tag, for the pages in src/gallery-tags.liquid. */
	eleventyConfig.addCollection(
		'artworksByTag',
		(api: {getFilteredByTag(tag: string): CollectionItem[]}) => {
			const byTag: Record<string, CollectionItem[]> = {};
			for (const item of api.getFilteredByTag('artworks').toReversed()) {
				for (const tag of item.data.tags ?? []) {
					if (tag !== 'artworks') {
						(byTag[tag] ??= []).push(item);
					}
				}
			}
			return Object.fromEntries(
				Object.entries(byTag).toSorted(([a], [b]) => a.localeCompare(b)),
			);
		},
	);
}
