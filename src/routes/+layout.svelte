<!--
  @file src/routes/+layout.svelte
  @description Root layout shell for OpenLearn.
  Loads fonts (Outfit, Newsreader incl. italic, JetBrains Mono), page metadata,
  the tactile paper dot-grid background mesh, and persistent HeaderNav and EditorialFooter.
-->
<script lang="ts">
	import '@fontsource-variable/outfit';
	import '@fontsource-variable/newsreader';
	import '@fontsource-variable/newsreader/wght-italic.css';
	import '@fontsource-variable/jetbrains-mono';
	import '../app.css';
	import { HeaderNav, EditorialFooter } from '#lib/components/layout/index.js';

	let { children } = $props();

	const title = 'OpenLearn — Turn Online Content Into Learning You Can Finish';
	const description =
		'OpenLearn turns scattered videos from YouTube and the open web into structured learning paths with practice, progress tracking, and verified completion.';
	const keywords = [
		'OpenLearn',
		'Open Curriculum',
		'YouTube Learning',
		'Self-Taught Developers',
		'Structured Learning',
		'Active Recall',
		'Distraction-Free Learning'
	].join(',');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="author" content="OpenLearn Community" />
	<meta name="keywords" content={keywords} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:site_name" content="OpenLearn" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
</svelte:head>

<!-- Subtle Tactile Dot-Grid Background Mesh -->
<div class="taste-bg-mesh" aria-hidden="true"></div>

<HeaderNav />
<main class="relative z-10 flex flex-col">{@render children()}</main>
<EditorialFooter />
