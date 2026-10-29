import { defineEnvVars } from '@sveltejs/kit/env';

// Optional (undefined when unset): the app shows "Backend not configured" instead of failing the build.
const optional = (v: string | undefined) => v || undefined;

export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: { public: true, schema: optional },
	PUBLIC_SUPABASE_ANON_KEY: { public: true, schema: optional }
});
