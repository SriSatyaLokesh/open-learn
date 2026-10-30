import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { inject } from 'vitest';

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

export const env = () => inject('env');

export async function guest(): Promise<SupabaseClient> {
	const e = env();
	const c = createClient(e.url, e.anonKey, opts);
	const { error } = await c.auth.signInAnonymously();
	if (error) throw error;
	return c;
}

export function service(): SupabaseClient {
	const e = env();
	return createClient(e.url, e.serviceKey, opts);
}

function ok(r: { data: { id: string } | null; error: unknown }): { id: string } {
	if (r.error) throw r.error;
	return r.data!;
}

/** Insert path -> module -> concept -> resource as `client`, using a service-upserted video. */
export async function seedPath(client: SupabaseClient) {
	const { data: u } = await client.auth.getUser();
	const uid = u.user!.id;
	const video = ok(
		await service()
			.from('video')
			.upsert({ provider_video_id: 'dQw4w9WgXcQ' }, { onConflict: 'provider,provider_video_id' })
			.select('id')
			.single()
	);
	const path = ok(
		await client.from('learning_path').insert({ title: 'T', author_id: uid }).select('id').single()
	);
	const mod = ok(
		await client
			.from('module')
			.insert({ path_id: path.id, title: 'M', order_key: 'a' })
			.select('id')
			.single()
	);
	const concept = ok(
		await client
			.from('concept')
			.insert({ module_id: mod.id, path_id: path.id, title: 'C', order_key: 'a' })
			.select('id')
			.single()
	);
	const res = ok(
		await client
			.from('resource')
			.insert({ concept_id: concept.id, path_id: path.id, video_id: video.id, order_key: 'a' })
			.select('id')
			.single()
	);
	return { pathId: path.id, moduleId: mod.id, conceptId: concept.id, resourceId: res.id };
}
