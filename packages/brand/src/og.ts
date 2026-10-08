import type {BrandConfig} from './config.ts';
import {markSvg} from './mark.ts';
import {h, svgDataUri, toPng, toSvg} from './render.ts';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export interface OgContent {
	/** Small line above the title, next to the logo. */
	eyebrow: string;
	title: string;
	/** Line under the title: a date, description, or domain. */
	subtitle?: string | undefined;
}

/** Shrinks long titles; anything past four lines is cut off with an ellipsis. */
function titleSize(title: string): number {
	if (title.length <= 24) return 84;
	if (title.length <= 48) return 68;
	if (title.length <= 80) return 56;
	return 46;
}

export async function renderOgImage(
	config: BrandConfig,
	{eyebrow, title, subtitle}: OgContent,
): Promise<Buffer> {
	const {background, foreground, muted, accent} = config.colors;
	const mark = svgDataUri(await markSvg(config, {rounded: true}));

	const svg = await toSvg(
		h(
			'div',
			{
				style: {
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					width: OG_WIDTH,
					height: OG_HEIGHT,
					padding: '72px 88px 96px',
					background,
					borderBottom: `24px solid ${accent}`,
					fontFamily: 'Inter',
				},
			},
			h(
				'div',
				{style: {display: 'flex', alignItems: 'center', gap: 24}},
				h('img', {src: mark, width: 72, height: 72}),
				h(
					'div',
					{style: {display: 'flex', fontSize: 32, color: muted}},
					eyebrow,
				),
			),
			h(
				'div',
				{
					style: {
						display: 'block',
						fontSize: titleSize(title),
						fontWeight: 700,
						lineHeight: 1.12,
						letterSpacing: '-0.02em',
						color: foreground,
						lineClamp: 4,
					},
				},
				title,
			),
			h(
				'div',
				{style: {display: 'block', fontSize: 32, color: muted, lineClamp: 1}},
				subtitle ?? '',
			),
		),
		OG_WIDTH,
		OG_HEIGHT,
	);
	return toPng(svg, OG_WIDTH);
}

/** Where the build writes a page's generated image: /posts/x/ --> /assets/images/og/posts/x.png */
export function ogImageUrl(pageUrl: string): string {
	const path = pageUrl.replace(/\/$/, '').replace(/\.html$/, '') || '/index';
	return `/assets/images/og${path}.png`;
}

export function hostOf(url: string): string {
	return new URL(url).host;
}
