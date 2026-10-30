import { describe, expect, it } from 'vitest';
import { guest, seedPath, service } from './helpers';

describe('RLS', () => {
	it('new guest gets a profile', async () => {
		const g = await guest();
		const { data, error } = await g.from('profile').select('handle');
		expect(error).toBeNull();
		expect(data).toHaveLength(1);
		expect(data![0].handle).toMatch(/^guest-[0-9a-f]{10}$/);
	});

	it("guest B sees none of guest A's rows", async () => {
		const a = await guest();
		const b = await guest();
		const { resourceId } = await seedPath(a);
		const saved = await a.rpc('save_position', { p_resource_id: resourceId, p_seconds: 5 });
		expect(saved.error).toBeNull();
		for (const t of ['learning_path', 'module', 'concept', 'resource', 'resource_progress']) {
			const { data, error } = await b.from(t).select('*');
			expect(error, t).toBeNull();
			expect(data, t).toEqual([]);
		}
	});

	it("guest B cannot write progress for A's resource", async () => {
		const a = await guest();
		const b = await guest();
		const { resourceId } = await seedPath(a);
		const { data: u } = await b.auth.getUser();
		const { error } = await b
			.from('resource_progress')
			.insert({ user_id: u.user!.id, resource_id: resourceId, last_position_seconds: 1 });
		expect(error?.code).toBe('42501');
	});

	it("guest B cannot insert a module under A's path", async () => {
		const a = await guest();
		const b = await guest();
		const { pathId } = await seedPath(a);
		const { error } = await b.from('module').insert({ path_id: pathId, title: 'x', order_key: 'z' });
		expect(error?.code).toBe('42501');
	});

	it("guest B cannot attach a concept to A's module", async () => {
		const a = await guest();
		const b = await guest();
		const { moduleId } = await seedPath(a);
		const { pathId } = await seedPath(b);
		const { error } = await b
			.from('concept')
			.insert({ module_id: moduleId, path_id: pathId, title: 'x', order_key: 'z' });
		expect(error?.code).toBe('23503');
	});

	it("guest B cannot attach a resource to A's concept", async () => {
		const a = await guest();
		const b = await guest();
		const { conceptId } = await seedPath(a);
		const { pathId } = await seedPath(b);
		const { data: v } = await service().from('video').select('id').limit(1).single();
		const { error } = await b.from('resource').insert({
			concept_id: conceptId,
			path_id: pathId,
			video_id: v!.id,
			kind: 'alternative',
			order_key: 'z'
		});
		expect(error?.code).toBe('23503');
	});

	it("guest B cannot re-point own resource at A's concept", async () => {
		const a = await guest();
		const b = await guest();
		const { conceptId } = await seedPath(a);
		const { resourceId } = await seedPath(b);
		const { error } = await b.from('resource').update({ concept_id: conceptId, kind: 'alternative' }).eq('id', resourceId);
		expect(error?.code).toBe('23503');
	});

	it('authenticated user cannot write video', async () => {
		const g = await guest();
		await seedPath(await guest()); // ensures a video row exists
		const ins = await g.from('video').insert({ provider_video_id: 'aaaaaaaaaaa' });
		expect(ins.error).not.toBeNull();
		const { data: v } = await service().from('video').select('id,title').limit(1).single();
		const upd = await g.from('video').update({ title: 'hacked' }).eq('id', v!.id);
		expect(upd.error).toBeNull(); // no matching policy: 0 rows, silently
		const { data: after } = await service().from('video').select('title').eq('id', v!.id).single();
		expect(after!.title).toBe(v!.title);
	});

	it('guest cannot publish', async () => {
		const g = await guest();
		const { pathId } = await seedPath(g);
		const { error } = await g.from('learning_path').update({ visibility: 'public' }).eq('id', pathId);
		expect(error).not.toBeNull();
	});

	it('guest can rename own path', async () => {
		const g = await guest();
		const { pathId } = await seedPath(g);
		const { error } = await g.from('learning_path').update({ title: 'Renamed' }).eq('id', pathId);
		expect(error).toBeNull();
		const { data } = await g.from('learning_path').select('title').eq('id', pathId).single();
		expect(data!.title).toBe('Renamed');
	});
});
