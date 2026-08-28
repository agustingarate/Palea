export type SessionCleanup = () => void | Promise<void>;

/** Coordinates idempotent, user-scoped local cleanup without coupling features. */
export class SessionCleanupRegistry {
  private readonly handlers = new Set<SessionCleanup>();

  register(handler: SessionCleanup): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async clear(): Promise<unknown[]> {
    const results = await Promise.allSettled(
      [...this.handlers].map((handler) => handler()),
    );
    return results.flatMap((result) =>
      result.status === 'rejected' ? [result.reason] : [],
    );
  }
}
