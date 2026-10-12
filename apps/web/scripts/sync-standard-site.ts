/**
 * Publishes your blog posts as standard.site records on your AT Protocol
 * account (https://standard.site), so link previews on Bluesky
 * show your site as a publication instead of a plain link card.
 *
 * It creates or updates one site.standard.publication record for the site
 * and one site.standard.document record per published post, then writes
 * their AT-URIs to src/_data/standardSite.json. The build reads that file to
 * emit <link rel="site.standard.*"> tags and /.well-known/site.standard.publication,
 * so commit it if running locally or let CI do it.
 *
 * Off unless `standardSite.enabled` is true in src/_data/site.yml.
 * Credentials come from the environment (or apps/web/.env):
 *   ATPROTO_HANDLE        you.bsky.social, or your domain handle
 *   ATPROTO_APP_PASSWORD  an app password, not your account password
 *   ATPROTO_SERVICE       optional, your PDS if not hosted by Bluesky
 *
 * Usage:
 *   pnpm sync:standard-site             # from the repository root
 *   pnpm sync:standard-site --dry-run   # show what would change, write nothing
 *
 * Setup guide: docs/standard-site.md
 */

import {AtpAgent} from '@atproto/api';
import {loadConfig} from '@site/cms/config';
import {listPosts} from '@site/cms/posts';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import type {StandardSiteData} from '../config/seo.ts';
import {loadSite} from '../config/site.ts';

const WEB_ROOT = path.resolve(import.meta.dirname, '..');
const DATA_PATH = path.join(WEB_ROOT, 'src', '_data', 'standardSite.json');
const DEFAULT_ICON = 'src/static/apple-touch-icon.png';
const DEFAULT_SERVICE = 'https://bsky.social';

const PUBLICATION = 'site.standard.publication';
const DOCUMENT = 'site.standard.document';

const ICON_MIME_TYPES: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
};

const dryRun = process.argv.includes('--dry-run');
const site = loadSite();

if (!site.standardSite?.enabled) {
	console.log(
		'standard.site sync is disabled. Set standardSite.enabled in src/_data/site.yml to turn it on (see docs/standard-site.md).',
	);
	process.exit(0);
}

try {
	process.loadEnvFile(path.join(WEB_ROOT, '.env'));
} catch {
	// No .env file; use the environment as-is (e.g. CI secrets).
}

const HANDLE = process.env.ATPROTO_HANDLE;
const APP_PASSWORD = process.env.ATPROTO_APP_PASSWORD;
const SERVICE = process.env.ATPROTO_SERVICE || DEFAULT_SERVICE;

if (!HANDLE || !APP_PASSWORD) {
	console.error(
		'Missing credentials. Set ATPROTO_HANDLE and ATPROTO_APP_PASSWORD in apps/web/.env or the environment (see docs/standard-site.md).',
	);
	process.exit(1);
}

interface ExistingRecord {
	uri: string;
	value: Record<string, any>;
}

interface DocumentInput {
	path: string;
	title: string;
	description?: string;
	publishedAt: string;
	updatedAt?: string;
	tags?: string[];
}

async function listAllRecords(
	agent: AtpAgent,
	did: string,
	collection: string,
): Promise<ExistingRecord[]> {
	const records: ExistingRecord[] = [];
	let cursor: string | undefined;
	do {
		const {data} = await agent.com.atproto.repo.listRecords({
			repo: did,
			collection,
			limit: 100,
			...(cursor ? {cursor} : {}),
		});
		records.push(
			...data.records.map((r) => ({
				uri: r.uri,
				value: r.value as Record<string, any>,
			})),
		);
		({cursor} = data);
	} while (cursor);
	return records;
}

function rkeyFromUri(uri: string): string {
	return uri.split('/').pop()!;
}

/**
 * Blobs are content-addressed, so re-uploading the same icon is harmless but
 * wasteful. A sha256 of the icon is stored on the publication record, and the
 * upload is skipped when the local file hasn't changed.
 */
async function resolveIcon(
	agent: AtpAgent,
	existing: ExistingRecord | undefined,
): Promise<{icon: unknown; iconSha256: string}> {
	const iconPath = path.resolve(
		WEB_ROOT,
		site.standardSite?.icon ?? DEFAULT_ICON,
	);
	const encoding = ICON_MIME_TYPES[path.extname(iconPath).toLowerCase()];
	if (!encoding) {
		throw new Error(
			`Unsupported icon type: ${iconPath}. Use a PNG, JPEG, or WebP file.`,
		);
	}
	const bytes = readFileSync(iconPath);
	const iconSha256 = createHash('sha256').update(bytes).digest('hex');

	if (existing?.value.iconSha256 === iconSha256 && existing.value.icon) {
		console.log('Icon unchanged, skipping upload.');
		return {icon: existing.value.icon, iconSha256};
	}
	if (dryRun) {
		console.log(`Would upload icon ${path.relative(WEB_ROOT, iconPath)}.`);
		return {icon: undefined, iconSha256};
	}
	const {data} = await agent.uploadBlob(bytes, {encoding});
	console.log('Icon changed (or new), uploaded blob.');
	return {icon: data.blob, iconSha256};
}

/** putRecord over an existing record, or createRecord and let the PDS assign a TID. */
async function upsertRecord(
	agent: AtpAgent,
	did: string,
	collection: string,
	existing: ExistingRecord | undefined,
	record: Record<string, unknown>,
): Promise<string> {
	if (existing) {
		if (!dryRun) {
			await agent.com.atproto.repo.putRecord({
				repo: did,
				collection,
				rkey: rkeyFromUri(existing.uri),
				record,
			});
		}
		return existing.uri;
	}
	if (dryRun) {
		return `at://${did}/${collection}/(new)`;
	}
	const {data} = await agent.com.atproto.repo.createRecord({
		repo: did,
		collection,
		record,
	});
	return data.uri;
}

/**
 * Published posts, with the URL path Eleventy gives them. The default path
 * must match the `permalink` in src/blog/blog.11tydata.json; if you change one,
 * change the other. A post whose front matter sets a plain `permalink` uses that.
 */
function collectPosts(): {documents: DocumentInput[]; skipped: number} {
	const documents: DocumentInput[] = [];
	let skipped = 0;

	for (const post of listPosts(loadConfig(WEB_ROOT).postsDir)) {
		const {data} = post;
		if (data.draft) {
			skipped++;
			continue;
		}
		const date = new Date(
			typeof data.date === 'string' ? data.date : `${post.date}T00:00:00Z`,
		);
		const datePath = date.toISOString().slice(0, 10).replaceAll('-', '/');
		const permalink =
			typeof data.permalink === 'string' && !data.permalink.includes('{{')
				? data.permalink
				: undefined;
		const tags = (data.tags ?? []).filter((tag) => tag !== 'posts');

		documents.push({
			path: permalink ?? `/posts/${datePath}/${post.slug}/`,
			title: data.title ?? post.slug,
			...(data.description && {description: data.description}),
			publishedAt: date.toISOString(),
			...(typeof data.updated === 'string' && {
				updatedAt: new Date(data.updated).toISOString(),
			}),
			...(tags.length > 0 && {tags}),
		});
	}

	return {documents, skipped};
}

async function main() {
	if (dryRun) {
		console.log('Dry run: nothing will be written.\n');
	}

	const agent = new AtpAgent({service: SERVICE});
	await agent.login({identifier: HANDLE!, password: APP_PASSWORD!});
	const {did} = agent.session!;

	const existingPublication = (
		await listAllRecords(agent, did, PUBLICATION)
	).find((r) => r.value.url === site.url);
	const {icon, iconSha256} = await resolveIcon(agent, existingPublication);

	const publication = await upsertRecord(
		agent,
		did,
		PUBLICATION,
		existingPublication,
		{
			$type: PUBLICATION,
			url: site.url,
			name: site.title,
			...(site.description && {description: site.description}),
			icon,
			iconSha256,
			preferences: {
				showInDiscover: site.standardSite?.showInDiscover ?? true,
			},
		},
	);
	console.log(
		`${existingPublication ? 'Updated' : 'Created'} publication: ${publication}`,
	);

	const existingDocuments = existingPublication
		? (await listAllRecords(agent, did, DOCUMENT)).filter(
				(r) => r.value.site === publication,
			)
		: [];
	const existingByPath = new Map(
		existingDocuments.map((r) => [r.value.path as string, r]),
	);

	const {documents, skipped} = collectPosts();
	const documentUris: Record<string, string> = {};

	for (const input of documents) {
		const existing = existingByPath.get(input.path);
		documentUris[input.path] = await upsertRecord(
			agent,
			did,
			DOCUMENT,
			existing,
			{$type: DOCUMENT, site: publication, ...input},
		);
		console.log(`  ${existing ? '✓ updated' : '+ created'} ${input.path}`);
	}

	// Delete documents whose post was removed, drafted, or moved to a new URL.
	const keptUris = new Set(Object.values(documentUris));
	let pruned = 0;
	for (const existing of existingDocuments) {
		if (keptUris.has(existing.uri)) {
			continue;
		}
		console.log(`  ✗ deleted ${existing.value.path ?? existing.uri}`);
		if (!dryRun) {
			await agent.com.atproto.repo.deleteRecord({
				repo: did,
				collection: DOCUMENT,
				rkey: rkeyFromUri(existing.uri),
			});
		}
		pruned++;
	}

	if (!dryRun) {
		const data: StandardSiteData = {
			did,
			publication,
			documents: documentUris,
		};
		writeFileSync(DATA_PATH, `${JSON.stringify(data, undefined, '\t')}\n`);
		console.log(`\nWrote ${path.relative(process.cwd(), DATA_PATH)}`);
	}

	console.log(
		`${dryRun ? 'Dry run done' : 'Done'}: ${documents.length} synced, ${skipped} drafts skipped, ${pruned} deleted`,
	);
}

main().catch((error: unknown) => {
	console.error('Sync failed:', error);
	process.exit(1);
});
