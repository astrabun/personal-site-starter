import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {Resvg} from '@resvg/resvg-js';
import type satoriEsm from 'satori';

// satori's ESM build references `__dirname`, which doesn't exist in ES modules,
// so load the CommonJS build instead.
const {default: satori} = createRequire(import.meta.url)('satori') as {
	default: typeof satoriEsm;
};

/** A satori element: the same shape as a React element, without needing React. */
export interface Node {
	type: string;
	props: {
		style?: Record<string, unknown>;
		children?: Child | Child[];
		[key: string]: unknown;
	};
}
type Child = Node | string | false | null | undefined;

export function h(
	type: string,
	props: Node['props'] = {},
	...children: Child[]
): Node {
	const kids = children.filter((child) => child !== false && child != null);
	// satori treats an array as multiple children, so unwrap a single child.
	return {
		type,
		props: {...props, children: kids.length === 1 ? kids[0] : kids},
	};
}

function font(weight: 400 | 700) {
	const file = `@fontsource/inter/files/inter-latin-${weight}-normal.woff`;
	return {
		name: 'Inter',
		weight,
		style: 'normal' as const,
		data: readFileSync(fileURLToPath(import.meta.resolve(file))),
	};
}

const fonts = [font(400), font(700)];

/** Lays out an element tree and returns an SVG with all text converted to paths. */
export function toSvg(
	node: Node,
	width: number,
	height: number,
): Promise<string> {
	// satori expects a React element; our plain objects are the same shape.
	return satori(node, {
		width,
		height,
		fonts,
	});
}

export function toPng(svg: string, width: number): Buffer {
	return new Resvg(svg, {fitTo: {mode: 'width', value: width}})
		.render()
		.asPng();
}

export function svgDataUri(svg: string): string {
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
