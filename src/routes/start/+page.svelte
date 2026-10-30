<script lang="ts">
	import { goto } from '$app/navigation';
	import { failureReasons } from '#lib/failure-reasons.js';
	import { ensureSession, getSupabase } from '#lib/supabase.js';

	type Failure = { input: string; reason: string };

	const sb = getSupabase();
	let input = $state('');
	let busy = $state(false);
	let error = $state('');
	let failures = $state<Failure[]>([]);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (busy || !sb) return;
		busy = true; // before any await, so a double submit is ignored
		error = '';
		failures = [];
		try {
			await ensureSession(sb);
			const { data, error: err } = await sb.functions.invoke('ingest', { body: { input } });
			if (err) {
				const body = await (err as { context?: Response }).context?.json?.().catch(() => null);
				failures = body?.failures ?? [];
				if (!failures.length) error = body?.error ?? 'Import failed. Please try again.';
				return;
			}
			// resolve() cannot carry a query string; the app is served from the root (no base path).
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto('/learn?path=' + data.publicCode, { state: { failures: data.failures } });
		} catch {
			error = 'Import failed. Please try again.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Import · OpenLearn</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="container py-16">
	<h1 class="mb-6 font-serif text-4xl">Import videos</h1>
	{#if !sb}
		<p role="alert">Backend not configured.</p>
	{:else}
		<form onsubmit={submit} class="flex max-w-2xl flex-col gap-4">
			<label for="links" class="font-medium">YouTube video links, one per line</label>
			<textarea
				id="links"
				bind:value={input}
				rows="8"
				class="rounded border border-charcoal/30 bg-surface p-3"
			></textarea>
			<button
				type="submit"
				disabled={busy}
				class="self-start rounded bg-charcoal px-5 py-2 text-white disabled:opacity-50">{busy ? 'Importing…' : 'Import'}</button
			>
		</form>
		<div aria-live="polite" class="mt-6 max-w-2xl">
			{#if error}
				<p role="alert">{error}</p>
			{/if}
			{#if failures.length}
				<div role="alert">
					<p>Nothing was imported:</p>
					<ul class="list-disc pl-5">
						{#each failures as f, i (i)}
							<li>{f.input}: {failureReasons[f.reason] ?? f.reason}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}
</section>
