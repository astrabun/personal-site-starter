import {mkdirSync, writeFileSync} from 'node:fs';
import {join, relative} from 'node:path';
import type {BrandConfig} from '../config.ts';
import {pngsToIco} from '../ico.ts';
import {markSvg} from '../mark.ts';
import {toPng} from '../render.ts';

export async function icons(config: BrandConfig) {
	const dir = config.paths.icons;
	mkdirSync(dir, {recursive: true});

	const rounded = await markSvg(config, {rounded: true});
	const square = await markSvg(config, {rounded: false});

	const files: [string, string | Buffer][] = [
		['favicon.svg', rounded],
		[
			'favicon.ico',
			pngsToIco(
				[16, 32, 48].map((size) => ({size, png: toPng(rounded, size)})),
			),
		],
		['apple-touch-icon.png', toPng(square, 180)],
	];

	for (const [name, contents] of files) {
		writeFileSync(join(dir, name), contents);
		console.log(`Wrote ${relative(process.cwd(), join(dir, name))}`);
	}
}
