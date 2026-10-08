import {parseArgs} from 'node:util';
import {icons} from './commands/icons.ts';
import {ogDefault, ogForPage} from './commands/og.ts';
import {loadConfig} from './config.ts';

const HELP = `
Usage: pnpm brand <command> [options]

Commands:
  all                 Generate the icons and the default social image
  icons               Generate favicon.svg, favicon.ico, and apple-touch-icon.png
  og                  Generate the site-wide default social image
  og <slug|path>      Generate a social image for one page or post and set its
                      \`image\` front matter (for a committed, editable image;
                      \`autoOgImage: true\` generates one at build instead)

Colors and the logo style come from \`brand\` in src/_data/site.yml.
Override them for one run with:
  --background <hex>  --foreground <hex>  --muted <hex>
  --accent <hex>      --on-accent <hex>
  --mark sun|initials --initials <XY>
`;

async function main() {
	const {positionals, values} = parseArgs({
		allowPositionals: true,
		options: {
			background: {type: 'string'},
			foreground: {type: 'string'},
			muted: {type: 'string'},
			accent: {type: 'string'},
			'on-accent': {type: 'string'},
			mark: {type: 'string'},
			initials: {type: 'string'},
			help: {type: 'boolean', short: 'h'},
		},
	});
	if (values.help) {
		console.log(HELP);
		return;
	}

	const {'on-accent': onAccent, help: _help, ...rest} = values;
	const config = loadConfig({...rest, ...(onAccent ? {onAccent} : {})});
	const [command, target] = positionals;

	switch (command) {
		case 'all':
			await icons(config);
			await ogDefault(config);
			return;
		case 'icons':
			return icons(config);
		case 'og':
			return target ? ogForPage(config, target) : ogDefault(config);
		default:
			console.log(HELP);
	}
}

try {
	await main();
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
