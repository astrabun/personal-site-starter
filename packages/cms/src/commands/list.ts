import {relative} from 'node:path';
import type {CmsConfig} from '../config.ts';
import {listPosts} from '../posts.ts';

export function list(config: CmsConfig, opts: {drafts?: boolean | undefined}) {
	const posts = listPosts(config.postsDir).filter(
		(post) => !opts.drafts || post.data.draft,
	);
	if (posts.length === 0) {
		console.log(opts.drafts ? 'No drafts.' : 'No posts yet.');
		return;
	}
	for (const post of posts) {
		const status = post.data.draft ? 'draft' : '     ';
		console.log(`${post.date}  ${status}  ${post.data.title ?? post.slug}`);
		console.log(`                   ${relative(process.cwd(), post.path)}`);
	}
}
