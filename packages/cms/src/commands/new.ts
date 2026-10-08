import {existsSync, mkdirSync} from 'node:fs';
import {join, relative} from 'node:path';
import type {CmsConfig} from '../config.ts';
import {
	postFilename,
	slugify,
	today,
	writePost,
	type FrontMatter,
} from '../posts.ts';
import {ask, confirm} from '../prompt.ts';

export interface NewOptions {
	title?: string | undefined;
	slug?: string | undefined;
	description?: string | undefined;
	tags?: string | undefined;
	date?: string | undefined;
	draft?: boolean | undefined;
	yes?: boolean | undefined;
}

export async function newPost(config: CmsConfig, opts: NewOptions) {
	const interactive = !opts.yes;
	const prompt = (q: string, value: string | undefined, fallback = '') =>
		value !== undefined || !interactive
			? Promise.resolve(value ?? fallback)
			: ask(q, fallback);

	const title = await prompt('Title', opts.title);
	if (!title) {
		throw new Error('A title is required.');
	}
	const slug = slugify(await prompt('Slug', opts.slug, slugify(title)));
	const description = await prompt('Description', opts.description);
	const tags = (await prompt('Tags (comma separated)', opts.tags))
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);
	const date = await prompt('Date', opts.date, today());
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw new Error(`Date must look like YYYY-MM-DD, got "${date}".`);
	}
	const draft =
		opts.draft ?? (interactive ? await confirm('Save as draft?', true) : false);

	const data: FrontMatter = {title};
	if (description) data.description = description;
	if (tags.length) data.tags = tags;
	if (draft) data.draft = true;

	mkdirSync(config.postsDir, {recursive: true});
	const path = join(config.postsDir, postFilename(date, slug));
	if (existsSync(path)) {
		throw new Error(`${relative(process.cwd(), path)} already exists.`);
	}

	writePost(path, data, '\n');
	console.log(
		`\nCreated ${relative(process.cwd(), path)}${draft ? ' (draft)' : ''}`,
	);
}
