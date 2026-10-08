import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {parse as parseYaml} from 'yaml';

export interface Colors {
	/** Page background of social images. */
	background: string;
	/** Main text color. */
	foreground: string;
	/** Secondary text color. */
	muted: string;
	/** Logo tile and accent bar color. */
	accent: string;
	/** Color of the mark drawn on top of `accent`. */
	onAccent: string;
}

export type MarkStyle = 'sun' | 'initials';

export interface BrandConfig {
	colors: Colors;
	mark: MarkStyle;
	initials: string;
	site: {title: string; description: string; url: string};
	paths: {
		/** Eleventy's input directory; used to turn file paths into URLs. */
		input: string;
		/** Where favicon.svg, favicon.ico, and apple-touch-icon.png go. */
		icons: string;
		/** The site-wide fallback social image. */
		ogDefault: string;
		/** Where per-page social images go. */
		ogDir: string;
		/** Folders searched when you pass a slug to `og`. */
		content: string[];
	};
}

/** Defaults match the dark theme in the starter's stylesheet (src/assets/css/main.css). */
export const DEFAULT_COLORS: Colors = {
	background: '#171614',
	foreground: '#ebe7e0',
	muted: '#9a948a',
	accent: '#6e84f0',
	onAccent: '#ffffff',
};

const DEFAULT_PATHS: BrandConfig['paths'] = {
	input: 'src',
	icons: 'src/static',
	ogDefault: 'src/assets/images/og-default.png',
	ogDir: 'src/assets/images/og',
	content: ['src/blog', 'src/pages'],
};

interface SiteYaml {
	title?: string;
	description?: string;
	url?: string;
	author?: {name?: string};
	brand?: Partial<Colors> & {mark?: MarkStyle; initials?: string};
}

function readJson(path: string): unknown {
	return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
}

function initialsOf(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0]?.toUpperCase() ?? '')
		.join('');
}

/**
 * Brand settings come from the `brand` section of src/_data/site.yml, with
 * output paths overridable via a `brand` field in the site's package.json.
 * The CLI runs through `pnpm brand`, so the working directory is the site package.
 */
export function loadConfig(
	overrides: Partial<Colors> & {mark?: string; initials?: string} = {},
	cwd = process.cwd(),
): BrandConfig {
	const pkg = readJson(resolve(cwd, 'package.json')) as {
		brand?: Partial<BrandConfig['paths']>;
	};
	const paths = {...DEFAULT_PATHS, ...pkg.brand};
	const sitePath = resolve(cwd, paths.input, '_data/site.yml');
	const siteYaml: unknown = existsSync(sitePath)
		? parseYaml(readFileSync(sitePath, 'utf8'))
		: {};
	const site = (siteYaml ?? {}) as SiteYaml;
	const brand = {...site.brand, ...overrides};

	const colors = {...DEFAULT_COLORS};
	for (const key of Object.keys(colors) as (keyof Colors)[]) {
		const value = brand[key];
		if (value === undefined) continue;
		if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value)) {
			throw new Error(
				`brand.${key} must be a hex color like #6e84f0, got "${value}".`,
			);
		}
		colors[key] = value;
	}

	const mark = brand.mark ?? 'sun';
	if (mark !== 'sun' && mark !== 'initials') {
		throw new Error(`brand.mark must be "sun" or "initials", got "${mark}".`);
	}

	return {
		colors,
		mark,
		initials: (
			brand.initials ?? initialsOf(site.author?.name ?? site.title ?? '')
		).slice(0, 2),
		site: {
			title: site.title ?? 'My Website',
			description: site.description ?? '',
			url: site.url ?? 'https://example.com',
		},
		paths: {
			input: resolve(cwd, paths.input),
			icons: resolve(cwd, paths.icons),
			ogDefault: resolve(cwd, paths.ogDefault),
			ogDir: resolve(cwd, paths.ogDir),
			content: paths.content.map((dir) => resolve(cwd, dir)),
		},
	};
}
