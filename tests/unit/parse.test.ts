import { describe, expect, it } from 'vitest';
import { parse } from '../../src/modules/youtube';

const ID = 'dQw4w9WgXcQ';
describe('parse', () => {
	it.each([
		`https://www.youtube.com/watch?v=${ID}`,
		`https://youtu.be/${ID}`,
		`https://youtu.be/${ID}?t=42`,
		`https://www.youtube.com/embed/${ID}`,
		`https://www.youtube.com/shorts/${ID}`,
		`https://m.youtube.com/watch?v=${ID}&feature=share`,
		`youtube.com/watch?v=${ID}&utm_source=x&t=1m30s`
	])('extracts the id from %s', (url) =>
		expect(parse(url).refs).toEqual([{ kind: 'video', providerVideoId: ID, sourceUrl: url }])
	);

	it('watch with list yields video then playlist', () =>
		expect(
			parse(`https://www.youtube.com/watch?v=${ID}&list=PL123`).refs.map((r) => r.kind)
		).toEqual(['video', 'playlist']));
	it('bare playlist URL', () =>
		expect(parse('https://www.youtube.com/playlist?list=PL123').refs[0]).toMatchObject({
			kind: 'playlist',
			providerPlaylistId: 'PL123'
		}));
	it('non-YouTube, malformed and 10-char ids go to invalid', () =>
		expect(parse('https://vimeo.com/1\nnot a url\nhttps://youtu.be/short12345').invalid).toEqual([
			'https://vimeo.com/1',
			'not',
			'a',
			'url',
			'https://youtu.be/short12345'
		]));
	it('ignores blank lines, CRLF and surrounding whitespace', () => {
		const r = parse(`\r\n  https://youtu.be/${ID}\t\r\n\r\nhttps://youtu.be/M7lc1UVf-VE  \r\n`);
		expect(r.refs.map((x) => (x as { providerVideoId: string }).providerVideoId)).toEqual([
			ID,
			'M7lc1UVf-VE'
		]);
		expect(r.invalid).toEqual([]);
	});
});
