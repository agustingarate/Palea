/** Framework- and provider-independent contract for the authenticated session. */
export type SessionUser = {
  id: string;
  email: string;
  displayName?: string;
};

export type Session = {
  user: SessionUser;
  expiresAt?: string;
};

export interface SessionRepository {
  getCurrent(): Promise<Session | null>;
  signOut(): Promise<void>;
}
