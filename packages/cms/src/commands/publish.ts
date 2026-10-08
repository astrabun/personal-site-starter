import {existsSync, renameSync} from 'node:fs';
import {basename, join, relative, resolve} from 'node:path';
import type {CmsConfig} from '../config.ts';
import {listPosts, postFilename, today, writePost} from '../posts.ts';
import {ask, confirm} from '../prompt.ts';

export async function publish(
	config: CmsConfig,
	target: string | undefined,
	opts: {keepDate?: boolean | undefined; yes?: boolean | undefined},
) {
	const drafts = listPosts(config.postsDir).filter((post) => post.data.draft);
	if (drafts.length === 0) {
		console.log('No drafts to publish.');
		return;
	}

	let post = target
		? drafts.find(
				(d) =>
					d.path === resolve(target) ||
					basename(d.path) === target ||
					d.slug === target,
			)
		: undefined;

	if (target && !post) {
		throw new Error(`No draft matching "${target}".`);
	}
	if (!post) {
		drafts.forEach((d, i) =>
			console.log(`  ${i + 1}. ${d.data.title ?? d.slug}  (${d.date})`),
		);
		const choice = Number.parseInt(await ask('\nPublish which?'), 10);
		post = drafts[choice - 1];
		if (!post) {
			throw new Error('Invalid selection.');
		}
	}

	const date = today();
	const redate =
		!opts.keepDate &&
		post.date !== date &&
		(opts.yes ||
			(await confirm(
				`Change the post date from ${post.date} to ${date}?`,
				true,
			)));
	const dest = redate
		? join(config.postsDir, postFilename(date, post.slug))
		: post.path;
	if (dest !== post.path && existsSync(dest)) {
		throw new Error(`${relative(process.cwd(), dest)} already exists.`);
	}

	const {draft: _draft, ...data} = post.data;
	writePost(post.path, data, post.body);
	if (dest !== post.path) {
		renameSync(post.path, dest);
	}
	console.log(`Published ${relative(process.cwd(), dest)}`);
}
