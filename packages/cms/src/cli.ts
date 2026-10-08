import {parseArgs} from 'node:util';
import {list} from './commands/list.ts';
import {newPost} from './commands/new.ts';
import {publish} from './commands/publish.ts';
import {loadConfig} from './config.ts';
import {closePrompt} from './prompt.ts';

const HELP = `
Usage: pnpm cms <command> [options]

Commands:
  new [title]        Create a new post (prompts for anything not passed)
      --slug <slug>        URL slug (default: from title)
      --description <text>
      --tags <a,b,c>
      --date <YYYY-MM-DD>  (default: today)
      --draft / --no-draft
      -y, --yes            Don't prompt; use defaults for anything missing

  list               List posts, newest first
      --drafts             Only show drafts

  publish [draft]    Publish a draft (by slug or filename; prompts if omitted)
      --keep-date          Don't move the post date to today
      -y, --yes            Don't prompt
`;

async function main() {
	const {positionals, values} = parseArgs({
		allowPositionals: true,
		allowNegative: true,
		options: {
			slug: {type: 'string'},
			description: {type: 'string'},
			tags: {type: 'string'},
			date: {type: 'string'},
			draft: {type: 'boolean'},
			drafts: {type: 'boolean'},
			'keep-date': {type: 'boolean'},
			yes: {type: 'boolean', short: 'y'},
			help: {type: 'boolean', short: 'h'},
		},
	});
	const [command, ...rest] = positionals;
	const config = loadConfig();

	if (values.help) {
		console.log(HELP);
		return;
	}

	switch (command) {
		case 'new':
			return newPost(config, {
				title: rest.join(' ') || undefined,
				slug: values.slug,
				description: values.description,
				tags: values.tags,
				date: values.date,
				draft: values.draft,
				yes: values.yes,
			});
		case 'list':
			return list(config, {drafts: values.drafts});
		case 'publish':
			return publish(config, rest[0], {
				keepDate: values['keep-date'],
				yes: values.yes,
			});
		default:
			console.log(HELP);
	}
}

try {
	await main();
} catch (error) {
	console.error(`\n${error instanceof Error ? error.message : String(error)}`);
	process.exitCode = 1;
} finally {
	closePrompt();
}
