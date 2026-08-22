export interface AuthSession {
  userId: string;
  email: string | null;
}

export type SocialProvider = 'google' | 'linkedin_oidc';
