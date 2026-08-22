import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { RequestIdentity } from '@palea/trpc';
import { environment } from '../config/environment';

@Injectable()
export class AuthService {
  private readonly supabase = createClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  async authenticate(
    header: string | undefined,
  ): Promise<RequestIdentity | null> {
    const match = /^Bearer\s+(.+)$/i.exec(header ?? '');
    if (!match) return null;
    const { data, error } = await this.supabase.auth.getUser(match[1]);
    if (error || !data.user) return null;
    const metadataRoles = data.user.app_metadata.roles;
    return {
      subject: data.user.id,
      email: data.user.email ?? null,
      roles: Array.isArray(metadataRoles)
        ? metadataRoles.filter(
            (role): role is string => typeof role === 'string',
          )
        : [],
    };
  }
}
