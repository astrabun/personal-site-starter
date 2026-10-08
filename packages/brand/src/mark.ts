import type {BrandConfig} from './config.ts';
import {h, toSvg} from './render.ts';

export interface MarkOptions {
	/** Round the tile's corners. Off for apple-touch-icon, which iOS rounds itself. */
	rounded: boolean;
}

/**
 * The site's logo mark as an SVG: a colored tile with either a sun-over-the-
 * horizon glyph or the author's initials.
 */
export async function markSvg(
	config: BrandConfig,
	{rounded}: MarkOptions,
): Promise<string> {
	const {accent, onAccent} = config.colors;
	const rx = rounded ? 7 : 0;

	if (config.mark === 'sun') {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
	<rect width="32" height="32" rx="${rx}" fill="${accent}"/>
	<circle cx="16" cy="15" r="6.5" fill="${onAccent}"/>
	<rect x="6" y="23" width="20" height="2.5" rx="1.25" fill="${onAccent}"/>
</svg>
`;
	}

	// Text is converted to paths, so the SVG looks the same without the font installed.
	const size = 256;
	const fontSize = config.initials.length > 1 ? 118 : 150;
	const svg = await toSvg(
		h(
			'div',
			{
				style: {
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: size,
					height: size,
					borderRadius: (rx / 32) * size,
					background: accent,
					color: onAccent,
					fontSize,
					fontWeight: 700,
					letterSpacing: -fontSize * 0.04,
				},
			},
			config.initials,
		),
		size,
		size,
	);
	// Drop the fixed pixel size and keep satori's viewBox, so the icon scales cleanly.
	return `${svg.replace(/ width="\d+" height="\d+"/, '')}\n`;
}
