<script lang="ts">
	import { page } from '$app/state';
	import { getSupabase } from '#lib/supabase.js';
	import { loadYouTubeApi, type YTPlayer } from '#lib/youtube-player.js';

	type Item = { id: string; videoId: string; title: string };

	const reasons: Record<string, string> = {
		unsupported: 'not a supported link',
		invalid_url: 'not a YouTube video link (invalid URL)',
		not_found: 'video not found',
		not_embeddable: 'video cannot be embedded'
	};
	const PAUSED = 2;

	const sb = getSupabase();
	const failures = page.state.failures ?? [];

	let status = $state<'loading' | 'ready' | 'notfound' | 'error'>('loading');
	let title = $state('');
	let items = $state<Item[]>([]);
	let current = $state(0);
	let resumedAt = $state<number | null>(null);
	let offline = $state(false);
	let target = $state<HTMLElement>();

	let player: YTPlayer | undefined;
	let playing = false;
	const positions: Record<string, number> = {};

	const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
	const iframeTitle = () => `${items[current].title} — YouTube video player`;

	async function save() {
		const t = player?.getCurrentTime();
		const item = items[current];
		if (!sb || !item || t === undefined || !Number.isFinite(t)) return;
		const p_seconds = Math.floor(t);
		const { error } = await sb.rpc('save_position', { p_resource_id: item.id, p_seconds });
		if (!error) positions[item.id] = Math.max(positions[item.id] ?? 0, p_seconds);
	}
	// Errors are swallowed: the next tick retries (no offline queue in S1).
	const trySave = () => void save().catch(() => {});

	function select(i: number) {
		current = i;
		player?.loadVideoById({
			videoId: items[i].videoId,
			startSeconds: positions[items[i].id] ?? 0
		});
		if (player) player.getIframe().title = iframeTitle();
	}

	$effect(() => {
		if (!sb) return;
		offline = !navigator.onLine;
		const setOffline = () => (offline = !navigator.onLine);
		const onHide = () => document.visibilityState === 'hidden' && trySave();
		window.addEventListener('online', setOffline);
		window.addEventListener('offline', setOffline);
		document.addEventListener('visibilitychange', onHide);
		window.addEventListener('pagehide', trySave);
		// Saves every ~10 s; only while a player exists (it is idle-cheap when paused: same position).
		const timer = setInterval(() => playing && trySave(), 10_000);

		const code = (page.url.searchParams.get('path') ?? '').trim().toUpperCase();
		(async () => {
			const { data: path } = await sb
				.from('learning_path')
				.select('id, title')
				.eq('public_code', code)
				.maybeSingle();
			if (!path) return (status = 'notfound');
			const [{ data: res }, { data: prog }] = await Promise.all([
				sb
					.from('resource')
					.select('id, order_key, video(provider_video_id, title)')
					.eq('path_id', path.id)
					.order('order_key'),
				sb.from('resource_progress').select('resource_id, last_position_seconds, updated_at')
			]);
			const list = (res ?? []).map((r) => {
				const v = r.video as unknown as { provider_video_id: string; title: string };
				return { id: r.id as string, videoId: v.provider_video_id, title: v.title };
			});
			if (!list.length) return (status = 'notfound');
			const ids = new Set(list.map((l) => l.id));
			const mine = (prog ?? []).filter((p) => ids.has(p.resource_id));
			for (const p of mine) positions[p.resource_id] = p.last_position_seconds;
			const last = mine.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0];
			title = path.title;
			items = list;
			current = last ? Math.max(0, list.findIndex((l) => l.id === last.resource_id)) : 0;
			resumedAt = last ? last.last_position_seconds : null;
			status = 'ready';

			const YT = await loadYouTubeApi();
			if (!target) return;
			const first = list[current];
			const p: YTPlayer = new YT.Player(target, {
				width: '100%',
				height: '100%',
				events: {
					onReady: () => {
						p.getIframe().title = iframeTitle();
						p.cueVideoById({ videoId: first.videoId, startSeconds: positions[first.id] ?? 0 });
					},
					onStateChange: (e) => {
						playing = e.data === 1;
						if (e.data === PAUSED) trySave();
					}
				}
			});
			player = p;
		})().catch(() => (status = 'error'));

		return () => {
			clearInterval(timer);
			window.removeEventListener('online', setOffline);
			window.removeEventListener('offline', setOffline);
			document.removeEventListener('visibilitychange', onHide);
			window.removeEventListener('pagehide', trySave);
			player?.destroy();
			player = undefined;
		};
	});
</script>

<svelte:head>
	<title>Focus Room · OpenLearn</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="container py-8 md:py-16">
	{#if !sb}
		<p role="alert">Backend not configured.</p>
	{:else if status === 'notfound'}
		<h1 class="font-serif text-4xl">Path not found</h1>
	{:else if status === 'error'}
		<p role="alert">Something went wrong loading this path. Please reload.</p>
	{:else}
		<h1 class="mb-6 font-serif text-3xl md:text-4xl">{title || 'Focus Room'}</h1>
		<div class="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
			<!-- Mounted once, never inside an {#if}; the YT API swaps the inner div for its iframe. -->
			<div
				data-testid="player"
				class="aspect-video min-h-[200px] min-w-[200px] overflow-hidden rounded bg-charcoal"
			>
				<div bind:this={target} class="h-full w-full"></div>
			</div>
			<div class="min-w-0">
				{#if offline}
					<p class="mb-4 rounded bg-surface-muted p-3">
						You're offline — playback needs a connection.
					</p>
				{/if}
				<ul data-testid="video-list" class="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
					{#each items as item, i (item.id)}
						<li>
							<button
								type="button"
								onclick={() => select(i)}
								aria-current={i === current ? 'true' : undefined}
								class="flex w-full items-center gap-3 rounded border border-charcoal/30 p-2 text-left aria-[current=true]:bg-surface-muted aria-[current=true]:font-medium"
							>
								<img
									src="https://i.ytimg.com/vi/{item.videoId}/mqdefault.jpg"
									alt=""
									class="h-14 w-24 shrink-0 rounded object-cover"
								/>
								<span>{item.title}</span>
							</button>
						</li>
					{/each}
				</ul>
				<p aria-live="polite" class="mt-4">
					{#if resumedAt !== null}Resumed at {fmt(resumedAt)}{/if}
				</p>
				{#if failures.length}
					<div class="mt-4">
						<p>Not imported:</p>
						<ul class="list-disc pl-5">
							{#each failures as f (f.input)}
								<li>{f.input}: {reasons[f.reason] ?? f.reason}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</section>
