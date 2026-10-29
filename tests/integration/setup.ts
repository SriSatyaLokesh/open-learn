import { execSync } from 'node:child_process';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
	export interface ProvidedContext {
		env: { url: string; anonKey: string; serviceKey: string };
	}
}

export default function setup(project: TestProject) {
	const out = execSync('pnpm exec supabase status -o env', {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'ignore']
	});
	const v = Object.fromEntries([...out.matchAll(/^(\w+)="(.*)"$/gm)].map((m) => [m[1], m[2]]));
	project.provide('env', {
		url: v.API_URL,
		anonKey: v.ANON_KEY,
		serviceKey: v.SERVICE_ROLE_KEY
	});
}
