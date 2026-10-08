import {createInterface} from 'node:readline';
import {stdin, stdout} from 'node:process';

// Lines are queued rather than read with `rl.question()`, so answers piped in
// from a script (`printf 'Title\n...' | pnpm cms new`) aren't dropped.
const rl = createInterface({input: stdin, output: stdout});
const buffered: string[] = [];
const waiting: ((line: string) => void)[] = [];
let closed = false;

rl.on('line', (line) => {
	const resolve = waiting.shift();
	if (resolve) {
		resolve(line);
	} else {
		buffered.push(line);
	}
});
rl.on('close', () => {
	closed = true;
	for (const resolve of waiting.splice(0)) {
		resolve('');
	}
});

function readLine(question: string): Promise<string> {
	rl.setPrompt(question);
	rl.prompt();
	const line = buffered.shift();
	if (line !== undefined) {
		return Promise.resolve(line);
	}
	if (closed) {
		return Promise.resolve('');
	}
	return new Promise((resolve) => waiting.push(resolve));
}

export async function ask(question: string, fallback = ''): Promise<string> {
	const hint = fallback ? ` (${fallback})` : '';
	const answer = await readLine(`${question}${hint}: `);
	return answer.trim() || fallback;
}

export async function confirm(
	question: string,
	fallback = false,
): Promise<boolean> {
	const answer = await ask(`${question} ${fallback ? '[Y/n]' : '[y/N]'}`);
	return answer ? /^y(es)?$/i.test(answer) : fallback;
}

export function closePrompt() {
	rl.close();
}
