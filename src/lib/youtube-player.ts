export type YTPlayer = {
	cueVideoById(o: { videoId: string; startSeconds: number }): void;
	loadVideoById(o: { videoId: string; startSeconds: number }): void;
	getCurrentTime(): number;
	getIframe(): HTMLIFrameElement;
	destroy(): void;
};

export type YTNamespace = {
	Player: new (
		el: HTMLElement,
		opts: {
			width?: string;
			height?: string;
			events?: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
		}
	) => YTPlayer;
};

type YTWindow = Window & { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void };

let pending: Promise<YTNamespace> | null = null;

// Resolves at once if window.YT.Player exists (lets tests inject a fake); else injects the script once.
export function loadYouTubeApi(): Promise<YTNamespace> {
	const w = window as YTWindow;
	if (w.YT?.Player) return Promise.resolve(w.YT);
	pending ??= new Promise((resolve, reject) => {
		w.onYouTubeIframeAPIReady = () => resolve(w.YT!);
		const s = document.createElement('script');
		s.src = 'https://www.youtube.com/iframe_api';
		s.onerror = () => {
			pending = null; // allow a retry
			reject(new Error('YouTube API failed to load'));
		};
		document.head.append(s);
	});
	return pending;
}
