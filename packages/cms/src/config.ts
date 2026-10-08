import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';

export interface CmsConfig {
	/** Directory containing `YYYY-MM-DD-slug.md` posts, relative to the site root. */
	postsDir: string;
}

const DEFAULTS: CmsConfig = {
	postsDir: 'src/blog',
};

/**
 * Reads the optional `cms` field from the site's package.json. The CLI is run
 * through `pnpm cms`, so the working directory is the site package.
 */
export function loadConfig(cwd = process.cwd()): CmsConfig {
	const pkgPath = resolve(cwd, 'package.json');
	const parsed: unknown = existsSync(pkgPath)
		? JSON.parse(readFileSync(pkgPath, 'utf8'))
		: {};
	const pkg = parsed as {cms?: Partial<CmsConfig>};
	const config = {...DEFAULTS, ...pkg.cms};
	return {...config, postsDir: resolve(cwd, config.postsDir)};
}
