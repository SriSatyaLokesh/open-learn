export type NormalizedVideo = {
	providerVideoId: string;
	title: string;
	channelName: string;
	durationSeconds: number;
	embeddable: boolean;
	regionBlocked: string[];
};

export type ResolveError = { kind: 'not_found' } | { kind: 'not_embeddable' };

const FAILURES: Record<string, ResolveError> = {
	unavailabl1: { kind: 'not_found' },
	noembedxxx1: { kind: 'not_embeddable' }
};

export function mockResolve(ids: string[]): Map<string, NormalizedVideo | ResolveError> {
	return new Map(
		ids.map((id) => [
			id,
			FAILURES[id] ?? {
				providerVideoId: id,
				title: `Mock video ${id}`,
				channelName: 'Mock Channel',
				durationSeconds: 600,
				embeddable: true,
				regionBlocked: []
			}
		])
	);
}
