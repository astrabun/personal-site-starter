import {existsSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {basename, join} from 'node:path';
import {parse as parseYaml, stringify as stringifyYaml} from 'yaml';

export interface FrontMatter {
	title?: string;
	description?: string;
	tags?: string[];
	draft?: boolean;
	[key: string]: unknown;
}

export interface Post {
	path: string;
	date: string;
	slug: string;
	data: FrontMatter;
	body: string;
}

const FILENAME = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/;
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

const pad = (n: number) => String(n).padStart(2, '0');

export function today(): string {
	const d = new Date();
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/[\s-]+/g, '-');
}

export function postFilename(date: string, slug: string): string {
	return `${date}-${slug}.md`;
}

export function readPost(path: string): Post | undefined {
	const match = FILENAME.exec(basename(path));
	if (!match) {
		return undefined;
	}
	const [, date = '', slug = ''] = match;
	const raw = readFileSync(path, 'utf8');
	const fm = FRONT_MATTER.exec(raw);
	const data: unknown = fm ? parseYaml(fm[1] ?? '') : undefined;
	return {
		path,
		date,
		slug,
		data: (data ?? {}) as FrontMatter,
		body: fm ? (fm[2] ?? '') : raw,
	};
}

/** All posts in `dir`, newest first. */
export function listPosts(dir: string): Post[] {
	if (!existsSync(dir)) {
		return [];
	}
	return readdirSync(dir)
		.map((file) => readPost(join(dir, file)))
		.filter((post): post is Post => post !== undefined)
		.toSorted((a, b) => b.date.localeCompare(a.date));
}

export function writePost(path: string, data: FrontMatter, body: string) {
	writeFileSync(path, `---\n${stringifyYaml(data)}---\n${body}`, 'utf8');
}
