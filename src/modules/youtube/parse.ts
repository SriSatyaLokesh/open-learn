// No imports: this file is also imported by the Deno ingest Edge Function by relative path.
export type ResourceRef =
	| { kind: 'video'; providerVideoId: string; sourceUrl: string }
	| { kind: 'playlist'; providerPlaylistId: string; sourceUrl: string };

export type ParseResult = { refs: ResourceRef[]; invalid: string[] };

const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const LIST_ID = /^[A-Za-z0-9_-]+$/;

function refsFor(token: string): ResourceRef[] {
	let url: URL;
	try {
		url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(token) ? token : `https://${token}`);
	} catch {
		return [];
	}
	if (!HOSTS.has(url.hostname)) return [];
	const [first, second] = url.pathname.split('/').filter(Boolean);
	const videoId =
		url.hostname === 'youtu.be'
			? first
			: first === 'watch'
				? url.searchParams.get('v')
				: first === 'embed' || first === 'shorts'
					? second
					: null;
	const list = first === 'playlist' || first === 'watch' ? url.searchParams.get('list') : null;
	const refs: ResourceRef[] = [];
	if (videoId && VIDEO_ID.test(videoId))
		refs.push({ kind: 'video', providerVideoId: videoId, sourceUrl: token });
	if (list && LIST_ID.test(list))
		refs.push({ kind: 'playlist', providerPlaylistId: list, sourceUrl: token });
	return refs;
}

export function parse(input: string): ParseResult {
	const result: ParseResult = { refs: [], invalid: [] };
	for (const token of input.split(/\s+/).filter(Boolean)) {
		const refs = refsFor(token);
		if (refs.length) result.refs.push(...refs);
		else result.invalid.push(token);
	}
	return result;
}
