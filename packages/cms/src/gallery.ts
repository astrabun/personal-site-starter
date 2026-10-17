import {existsSync, readdirSync} from 'node:fs';
import {basename, extname, join, resolve} from 'node:path';
import {readFrontMatter} from './posts.ts';

/** Keep in sync with IMAGE_EXTENSIONS in apps/web/config/gallery.ts. */
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

export const isImage = (file: string) =>
	IMAGE_EXTENSIONS.includes(extname(file).toLowerCase());

const stem = (file: string) => basename(file, extname(file)).toLowerCase();

/** "fern-study_2.png" --> "Fern study 2" */
export function titleFromFile(file: string): string {
	const words = basename(file, extname(file))
		.replace(/[-_.]+/g, ' ')
		.trim();
	return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Images in the gallery folder that no artwork uses, either as its main
 * image (`file`, or the same name as the .md) or as a detail shot.
 */
export function unusedImages(dir: string): string[] {
	if (!existsSync(dir)) {
		return [];
	}
	const files = readdirSync(dir);
	const used = new Set<string>();
	for (const md of files.filter((f) => f.endsWith('.md'))) {
		const {data} = readFrontMatter(join(dir, md));
		const details = (data.details ?? []) as {file?: string}[];
		if (typeof data.file === 'string') {
			used.add(resolve(dir, data.file));
		} else {
			const match = files.find((f) => isImage(f) && stem(f) === stem(md));
			if (match) used.add(join(dir, match));
		}
		for (const detail of details) {
			if (detail.file) used.add(resolve(dir, detail.file));
		}
	}
	return files
		.filter(isImage)
		.map((f) => join(dir, f))
		.filter((path) => !used.has(path));
}
