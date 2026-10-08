#!/usr/bin/env node
// Node strips TypeScript types natively (22.18+), so the CLI runs straight from source.
await import('../src/cli.ts');
