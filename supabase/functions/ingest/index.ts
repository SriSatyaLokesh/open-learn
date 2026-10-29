import { PROBE } from '../../../src/modules/youtube/parse.ts';
Deno.serve(() => new Response(PROBE));
