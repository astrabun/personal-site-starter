import {existsSync, mkdirSync, readdirSync, writeFileSync} from 'node:fs';
import {basename, dirname, join, relative, resolve} from 'node:path';
import type {BrandConfig} from '../config.ts';
import {readFrontMatter, writeFrontMatter} from '../front-matter.ts';
import {hostOf, renderOgImage, type OgContent} from '../og.ts';

const POST_FILENAME = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/;
const dateFormat = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'long',
	timeZone: 'UTC',
});

function write(path: string, png: Buffer) {
	mkdirSync(dirname(path), {recursive: true});
	writeFileSync(path, png);
	console.log(`Wrote ${relative(process.cwd(), path)}`);
}

/** Finds a Markdown file from a path, a filename, or a slug like "hello-world". */
function findSource(config: BrandConfig, target: string): string {
	if (existsSync(target)) return resolve(target);
	for (const dir of config.paths.content) {
		if (!existsSync(dir)) continue;
		const match = readdirSync(dir).find(
			(file) =>
				file === target ||
				file === `${target}.md` ||
				POST_FILENAME.exec(file)?.[2] === target,
		);
		if (match) return join(dir, match);
	}
	throw new Error(`No page or post matching "${target}".`);
}

/** The site-wide fallback image, used by any page without its own. */
export async function ogDefault(config: BrandConfig) {
	write(
		config.paths.ogDefault,
		await renderOgImage(config, {
			eyebrow: hostOf(config.site.url),
			title: config.site.title,
			subtitle: config.site.description,
		}),
	);
}

/**
 * Renders an image for one page or post, saves it next to the other generated
 * images, and points the page's `image` front matter at it. Use this when you
 * want a committed file you can edit; otherwise prefer `autoOgImage: true`.
 */
export async function ogForPage(config: BrandConfig, target: string) {
	const source = findSource(config, target);
	const {data, body} = readFrontMatter(source);
	const post = POST_FILENAME.exec(basename(source));
	const title = typeof data.title === 'string' ? data.title : config.site.title;
	const description =
		typeof data.description === 'string' ? data.description : undefined;

	const content: OgContent = {
		eyebrow: config.site.title,
		title,
		subtitle: post?.[1]
			? dateFormat.format(new Date(post[1]))
			: (description ?? hostOf(config.site.url)),
	};
	const out = join(config.paths.ogDir, `${basename(source, '.md')}.png`);
	write(out, await renderOgImage(config, content));

	const url = `/${relative(config.paths.input, out).split('\\').join('/')}`;
	if (data.image !== url) {
		data.image = url;
		data.imageAlt ??= title;
		delete data.autoOgImage;
		writeFrontMatter(source, data, body);
		console.log(`Set image: ${url} in ${relative(process.cwd(), source)}`);
	}
}
