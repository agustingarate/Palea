import { SessionCleanupRegistry } from './SessionCleanupRegistry';

describe('SessionCleanupRegistry', () => {
  it('runs every registered cleanup even when one fails', async () => {
    const registry = new SessionCleanupRegistry();
    const completed = jest.fn();
    registry.register(() => Promise.reject(new Error('storage unavailable')));
    registry.register(completed);

    const failures = await registry.clear();

    expect(completed).toHaveBeenCalledTimes(1);
    expect(failures).toHaveLength(1);
  });
});
