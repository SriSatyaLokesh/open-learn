import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as env from '$app/env/public';

let client: SupabaseClient | null = null;

// Read env lazily: page shells are prerendered and env access at module load would throw.
export function getSupabase(): SupabaseClient | null {
	if (client) return client;
	const { PUBLIC_SUPABASE_URL: url, PUBLIC_SUPABASE_ANON_KEY: key } = env;
	if (!url || !key) return null;
	client = createClient(url, key, {
		// keepalive lets pagehide saves survive unload.
		global: { fetch: (input, init) => fetch(input, { ...init, keepalive: true }) }
	});
	return client;
}

export async function ensureSession(sb: SupabaseClient): Promise<void> {
	const { data } = await sb.auth.getSession();
	if (data.session) return;
	const { error } = await sb.auth.signInAnonymously();
	if (error) throw error;
}
