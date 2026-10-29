import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { env, guest, service } from './helpers';

const A = 'dQw4w9WgXcQ';
const B = 'M7lc1UVf-VE';
const yt = (id: string) => `https://youtu.be/${id}`;

async function call(client: SupabaseClient | null, input: string) {
	const e = env();
	const headers: Record<string, string> = { apikey: e.anonKey, 'content-type': 'application/json' };
	if (client) headers.Authorization = `Bearer ${(await client.auth.getSession()).data.session!.access_token}`;
	const res = await fetch(`${e.url}/functions/v1/ingest`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ input })
	});
	return { status: res.status, body: await res.json().catch(() => null) };
}

async function resources(client: SupabaseClient, publicCode: string) {
	const { data: path } = await client.from('learning_path').select('id').eq('public_code', publicCode).single();
	const { data, error } = await client
		.from('resource')
		.select('source_url, order_key, video(provider_video_id)')
		.eq('path_id', path!.id)
		.order('order_key');
	if (error) throw error;
	return data as unknown as { source_url: string; video: { provider_video_id: string } }[];
}

describe('ingest', () => {
	it('imports two videos in order and reports the bad line', async () => {
		const g = await guest();
		const { status, body } = await call(g, `${yt(A)}\nhttps://vimeo.com/1\n${yt(B)}`);
		expect(status).toBe(200);
		expect(body.failures).toEqual([{ input: 'https://vimeo.com/1', reason: 'invalid_url' }]);
		const rows = await resources(g, body.publicCode);
		expect(rows.map((r) => r.video.provider_video_id)).toEqual([A, B]);
		expect(rows.map((r) => r.source_url)).toEqual([yt(A), yt(B)]);
	});

	it('dedupes, rejects playlists, mock failures', async () => {
		const g = await guest();
		const { status, body } = await call(
			g,
			`${yt(A)}\n${yt(A)}\nhttps://www.youtube.com/playlist?list=PL1\n${yt('unavailabl1')}`
		);
		expect(status).toBe(200);
		expect(body.failures).toEqual([
			{ input: 'https://www.youtube.com/playlist?list=PL1', reason: 'unsupported' },
			{ input: yt('unavailabl1'), reason: 'not_found' }
		]);
		expect(await resources(g, body.publicCode)).toHaveLength(1);
	});

	it('creates nothing when every item fails', async () => {
		const g = await guest();
		const { status, body } = await call(g, `https://vimeo.com/1\n${yt('unavailabl1')}`);
		expect(status).toBe(422);
		expect(body.failures).toHaveLength(2);
		const { count } = await g.from('learning_path').select('*', { count: 'exact', head: true });
		expect(count).toBe(0);
	});

	it('rejects bad requests', async () => {
		const g = await guest();
		expect((await call(null, yt(A))).status).toBe(401);
		expect((await call(g, 'x'.repeat(10001))).status).toBe(400);
		const many = Array.from({ length: 51 }, (_, i) => yt(`v${String(i).padStart(10, '0')}`)).join('\n');
		expect((await call(g, many)).status).toBe(400);
	});

	it('reuses the video row across paths', async () => {
		const [g1, g2] = [await guest(), await guest()];
		const id = crypto.randomUUID().replace(/-/g, '').slice(0, 11); // fresh per run: DB persists
		expect((await call(g1, yt(id))).status).toBe(200);
		expect((await call(g2, yt(id))).status).toBe(200);
		const svc = service();
		const { data: videos } = await svc.from('video').select('id').eq('provider_video_id', id);
		expect(videos).toHaveLength(1);
		const { count } = await svc
			.from('resource')
			.select('*', { count: 'exact', head: true })
			.eq('video_id', videos![0].id);
		expect(count).toBe(2);
	});

	it('answers CORS preflight', async () => {
		const res = await fetch(`${env().url}/functions/v1/ingest`, { method: 'OPTIONS' });
		expect(res.status).toBe(204);
		expect(res.headers.get('access-control-allow-origin')).toBe('*');
		const allow = res.headers.get('access-control-allow-headers') ?? '';
		for (const h of ['authorization', 'apikey', 'content-type', 'x-client-info']) expect(allow).toContain(h);
	});
});
