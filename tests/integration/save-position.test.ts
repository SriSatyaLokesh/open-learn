import { describe, expect, it } from 'vitest';
import { guest, seedPath } from './helpers';

describe('save_position', () => {
	it('keeps the maximum', async () => {
		const g = await guest();
		const { resourceId } = await seedPath(g);
		for (const s of [120, 60]) {
			const { error } = await g.rpc('save_position', { p_resource_id: resourceId, p_seconds: s });
			expect(error).toBeNull();
		}
		const { data } = await g.from('resource_progress').select('last_position_seconds').single();
		expect(data!.last_position_seconds).toBe(120);
	});

	it('rejects out-of-range seconds with 22023', async () => {
		const g = await guest();
		const { resourceId } = await seedPath(g);
		for (const s of [-1, 86401]) {
			const { error } = await g.rpc('save_position', { p_resource_id: resourceId, p_seconds: s });
			expect(error?.code).toBe('22023');
		}
	});

	it("rejects another guest's resource with P0002", async () => {
		const a = await guest();
		const b = await guest();
		const { resourceId } = await seedPath(a);
		const { error } = await b.rpc('save_position', { p_resource_id: resourceId, p_seconds: 10 });
		expect(error?.code).toBe('P0002');
	});
});
