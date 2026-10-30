import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { parse } from '../../../src/modules/youtube/parse.ts';
import { mockResolve } from '../../../src/modules/youtube/mock.ts';

const CORS = {
	'access-control-allow-origin': '*',
	'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info'
};
const json = (status: number, body: unknown) =>
	new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });

type Failure = { input: string; reason: 'unsupported' | 'invalid_url' | 'not_found' | 'not_embeddable' };
const key = (i: number) => 'a' + String(i).padStart(4, '0');

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
	if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

	const auth = req.headers.get('Authorization');
	if (!auth) return json(401, { error: 'Unauthorized' });
	const url = Deno.env.get('SUPABASE_URL')!;
	const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
		global: { headers: { Authorization: auth } }
	});
	const { data: u, error: authErr } = await userClient.auth.getUser();
	if (authErr || !u.user) return json(401, { error: 'Unauthorized' });

	const body = await req.json().catch(() => null);
	const input = body?.input;
	if (typeof input !== 'string') return json(400, { error: 'Body must be { input: string }' });
	if (input.length > 10000) return json(400, { error: 'Input is too long (max 10000 characters).' });

	const parsed = parse(input);
	const failures: Failure[] = parsed.invalid.map((i) => ({ input: i, reason: 'invalid_url' }));
	const videos: { id: string; sourceUrl: string }[] = [];
	const seen = new Set<string>();
	// R12: a playlist ref from the same URL as a video ref is context, not a request.
	const videoUrls = new Set(parsed.refs.flatMap((r) => (r.kind === 'video' ? [r.sourceUrl] : [])));
	for (const r of parsed.refs) {
		if (r.kind === 'playlist') {
			if (!videoUrls.has(r.sourceUrl)) failures.push({ input: r.sourceUrl, reason: 'unsupported' });
		} else if (!seen.has(r.providerVideoId)) {
			seen.add(r.providerVideoId);
			videos.push({ id: r.providerVideoId, sourceUrl: r.sourceUrl });
		}
	}
	if (videos.length > 50) return json(400, { error: 'Too many videos (max 50).' });

	const resolved = mockResolve(videos.map((v) => v.id));
	const ok: { id: string; sourceUrl: string; meta: Record<string, unknown> }[] = [];
	for (const v of videos) {
		const r = resolved.get(v.id)!;
		if ('kind' in r) failures.push({ input: v.sourceUrl, reason: r.kind });
		else ok.push({ ...v, meta: r });
	}
	if (!ok.length) return json(422, { failures });

	const svc = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
	const { data: vrows, error: vErr } = await svc
		.from('video')
		.upsert(
			ok.map(({ id, meta }) => ({
				provider_video_id: id,
				title: meta.title,
				channel_name: meta.channelName,
				duration_seconds: meta.durationSeconds,
				embeddable: meta.embeddable,
				region_blocked: meta.regionBlocked,
				last_synced_at: new Date().toISOString()
			})),
			{ onConflict: 'provider,provider_video_id' }
		)
		.select('id, provider_video_id');
	if (vErr) return json(500, { error: 'Could not save videos' });
	const videoId = new Map(vrows.map((v) => [v.provider_video_id, v.id]));

	const pathId = crypto.randomUUID();
	const title = `Imported path – ${new Date().toISOString().slice(0, 10)}`;
	let publicCode: string | undefined;
	for (let attempt = 0; attempt < 2 && !publicCode; attempt++) {
		const { data, error } = await userClient
			.from('learning_path')
			.insert({ id: pathId, title, author_id: u.user.id })
			.select('public_code')
			.single();
		if (data) publicCode = data.public_code;
		else if (error?.code !== '23505') break;
	}
	if (!publicCode) return json(500, { error: 'Could not create path' });

	const moduleId = crypto.randomUUID();
	const concepts = ok.map((v, i) => ({
		id: crypto.randomUUID(),
		module_id: moduleId,
		path_id: pathId,
		title: (v.meta.title as string) ?? v.id,
		order_key: key(i)
	}));
	const steps = [
		() => userClient.from('module').insert({ id: moduleId, path_id: pathId, title: 'Imported videos', order_key: 'a0000' }),
		() => userClient.from('concept').insert(concepts),
		() =>
			userClient.from('resource').insert(
				ok.map((v, i) => ({
					id: crypto.randomUUID(),
					concept_id: concepts[i].id,
					path_id: pathId,
					video_id: videoId.get(v.id),
					kind: 'primary',
					order_key: key(i),
					source_url: v.sourceUrl
				}))
			)
	];
	for (const step of steps) {
		const { error } = await step();
		if (error) {
			await userClient.from('learning_path').delete().eq('id', pathId);
			return json(500, { error: 'Could not save path' });
		}
	}
	return json(200, { publicCode, failures });
});
