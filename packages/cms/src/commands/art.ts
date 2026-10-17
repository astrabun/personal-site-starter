import {copyFileSync, existsSync, mkdirSync, renameSync} from 'node:fs';
import {basename, dirname, extname, join, relative, resolve} from 'node:path';
import type {CmsConfig} from '../config.ts';
import {isImage, titleFromFile, unusedImages} from '../gallery.ts';
import {slugify, today, writePost, type FrontMatter} from '../posts.ts';
import {ask} from '../prompt.ts';

export interface ArtOptions {
	title?: string | undefined;
	slug?: string | undefined;
	alt?: string | undefined;
	date?: string | undefined;
	description?: string | undefined;
	medium?: string | undefined;
	dimensions?: string | undefined;
	tags?: string | undefined;
	draft?: boolean | undefined;
	yes?: boolean | undefined;
}

/**
 * Adds artwork to the gallery. Images passed as arguments are copied in;
 * with no arguments, it asks about every image in the gallery folder that
 * doesn't have a .md file yet.
 */
export async function art(
	config: CmsConfig,
	files: string[],
	opts: ArtOptions,
) {
	// pnpm runs this from the site package; INIT_CWD is where you ran `pnpm cms`.
	const base = process.env.INIT_CWD ?? process.cwd();
	const sources = files.length
		? files.map((file) => resolve(base, file))
		: unusedImages(config.galleryDir);

	if (sources.length === 0) {
		console.log(
			`No new images in ${relative(process.cwd(), config.galleryDir)}. Add some, or pass a file: pnpm cms art path/to/image.jpg`,
		);
		return;
	}
	for (const source of sources) {
		if (!existsSync(source)) {
			throw new Error(`${source} doesn't exist.`);
		}
		if (!isImage(source)) {
			throw new Error(`${basename(source)} isn't a supported image type.`);
		}
	}

	mkdirSync(config.galleryDir, {recursive: true});
	if (!files.length) {
		console.log(
			`Found ${sources.length} new image${sources.length === 1 ? '' : 's'}.`,
		);
	}
	for (const source of sources) {
		// Flags like --title only make sense for a single image.
		await addArtwork(
			config,
			source,
			sources.length === 1 ? opts : {yes: opts.yes},
		);
	}
}

async function addArtwork(config: CmsConfig, source: string, opts: ArtOptions) {
	const interactive = !opts.yes;
	const prompt = (q: string, value: string | undefined, fallback = '') =>
		value !== undefined || !interactive
			? Promise.resolve(value ?? fallback)
			: ask(q, fallback);

	console.log(`\n${basename(source)}`);
	const title = await prompt(
		"Title (or 'skip')",
		opts.title,
		titleFromFile(source),
	);
	if (title.toLowerCase() === 'skip') {
		console.log('Skipped.');
		return;
	}
	const slug = slugify(await prompt('Slug', opts.slug, slugify(title)));
	if (!slug) {
		throw new Error('A slug is required.');
	}

	let alt = await prompt('Alt text (describe the image)', opts.alt);
	if (!alt && interactive) {
		console.log(
			'  Alt text is read aloud by screen readers and shown if the image fails to load.\n  A sentence about what the piece shows is plenty.',
		);
		alt = await ask('Alt text');
	}
	const date = await prompt('Date', opts.date, today());
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw new Error(`Date must look like YYYY-MM-DD, got "${date}".`);
	}
	const description = await prompt('Short description', opts.description);
	const medium = await prompt('Medium (e.g. Oil on canvas)', opts.medium);
	const dimensions = await prompt(
		'Dimensions (e.g. 24 × 36 in)',
		opts.dimensions,
	);
	const tags = (await prompt('Tags (comma separated)', opts.tags))
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);

	const image = join(
		config.galleryDir,
		`${slug}${extname(source).toLowerCase()}`,
	);
	const md = join(config.galleryDir, `${slug}.md`);
	for (const path of [md, image]) {
		if (path !== source && existsSync(path)) {
			throw new Error(`${relative(process.cwd(), path)} already exists.`);
		}
	}

	const data: FrontMatter = {title, date};
	if (alt) data.alt = alt;
	if (description) data.description = description;
	if (medium) data.medium = medium;
	if (dimensions) data.dimensions = dimensions;
	if (tags.length) data.tags = tags;
	if (opts.draft) data.draft = true;

	// Images already in the gallery folder are renamed to match; others are copied in.
	if (dirname(source) === config.galleryDir) {
		if (source !== image) renameSync(source, image);
	} else {
		copyFileSync(source, image);
	}
	writePost(md, data, '\n');

	console.log(
		`Added ${relative(process.cwd(), image)} and ${relative(process.cwd(), md)}${opts.draft ? ' (draft)' : ''}`,
	);
	if (!alt) {
		console.log(`  No alt text yet. Add an "alt:" line to ${basename(md)}.`);
	}
}
