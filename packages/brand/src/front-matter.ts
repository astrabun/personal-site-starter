import {readFileSync, writeFileSync} from 'node:fs';
import {parse as parseYaml, stringify as stringifyYaml} from 'yaml';

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export type FrontMatter = Record<string, unknown>;

export function readFrontMatter(path: string): {
	data: FrontMatter;
	body: string;
} {
	const raw = readFileSync(path, 'utf8');
	const match = FRONT_MATTER.exec(raw);
	const data: unknown = match ? parseYaml(match[1] ?? '') : undefined;
	return {
		data: (data ?? {}) as FrontMatter,
		body: match ? (match[2] ?? '') : raw,
	};
}

export function writeFrontMatter(
	path: string,
	data: FrontMatter,
	body: string,
) {
	writeFileSync(path, `---\n${stringifyYaml(data)}---\n${body}`, 'utf8');
}
