// Copies this starter into a new directory, without its git history, build
// output, or installed dependencies, and initializes a fresh git repository.
//
// Usage: pnpm new-site <directory>
// Relative paths resolve from the directory you ran the command in.

import {existsSync, readdirSync, cpSync, mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

const skip = new Set(['.git', 'node_modules', '_site', '.cache', 'dist']);

const target = process.argv[2];
if (!target) {
	console.error('Usage: pnpm new-site <directory>');
	process.exit(1);
}

// pnpm and npm set INIT_CWD to the directory the command was run from.
const base = process.env.INIT_CWD ?? process.cwd();
const dest = path.resolve(base, target);
const source = path.resolve(import.meta.dirname, '..');

if (existsSync(dest) && readdirSync(dest).length > 0) {
	console.error(`${dest} already exists and is not empty.`);
	process.exit(1);
}

mkdirSync(dest, {recursive: true});
cpSync(source, dest, {
	recursive: true,
	filter: (src) => !skip.has(path.basename(src)),
});
execFileSync('git', ['init', '--quiet', '--initial-branch=main'], {
	cwd: dest,
	stdio: 'inherit',
});

console.log(`
Created ${dest}

Next steps:
  cd ${target}
  pnpm install
  pnpm dev
  git add -A && git commit -m "Start site from starter"
  git remote add origin <your-repo-url>
  git push -u origin main
`);
