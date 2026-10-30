import { expect, it } from 'vitest';
import { mockResolve } from '../../src/modules/youtube';

it('resolves fixtures and failures', () => {
	const m = mockResolve(['dQw4w9WgXcQ', 'unavailabl1', 'noembedxxx1']);
	expect(m.get('dQw4w9WgXcQ')).toMatchObject({
		title: 'Mock video dQw4w9WgXcQ',
		channelName: 'Mock Channel',
		durationSeconds: 600,
		embeddable: true,
		regionBlocked: []
	});
	expect(m.get('unavailabl1')).toEqual({ kind: 'not_found' });
	expect(m.get('noembedxxx1')).toEqual({ kind: 'not_embeddable' });
});
