import {defineConfig} from 'oxlint';

export default defineConfig({
	plugins: ['typescript', 'unicorn', 'import', 'node'],
	categories: {
		correctness: 'error',
		suspicious: 'warn',
	},
	rules: {
		// Parsed YAML/JSON is cast to its expected shape at the boundary; that's intentional.
		'typescript/no-unsafe-type-assertion': 'off',
	},
	ignorePatterns: ['**/_site/**', '**/node_modules/**'],
});
