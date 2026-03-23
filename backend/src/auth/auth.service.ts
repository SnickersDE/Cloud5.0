import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import type { LoginBody, ProfileRow, RegisterBody } from './auth.types';

type LoginResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string | null;
    username: string;
    role: string;
  };
};

type ProfileIdentity = {
  username: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  private getSupabaseUrl() {
    return this.configService.get<string>('SUPABASE_URL') ?? '';
  }

  private getAnonKey() {
    return this.configService.get<string>('SUPABASE_ANON_KEY') ?? '';
  }

  private getServiceRoleKey() {
    return this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  }

  private createAnonClient() {
    const supabaseUrl = this.getSupabaseUrl();
    const supabaseAnonKey = this.getAnonKey();

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new UnauthorizedException(
        'SUPABASE_URL und SUPABASE_ANON_KEY müssen gesetzt sein.',
      );
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private createServiceClient(): SupabaseClient | null {
    const supabaseUrl = this.getSupabaseUrl();
    const serviceKey = this.getServiceRoleKey();

    if (!supabaseUrl || !serviceKey) {
      return null;
    }

    return createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private normalizeUsername(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
      .slice(0, 32);
  }

  private async makeUniqueUsername(
    serviceClient: SupabaseClient,
    baseUsername: string,
  ) {
    let candidate = this.normalizeUsername(baseUsername);

    if (!candidate) {
      candidate = `user${Math.floor(100000 + Math.random() * 900000)}`;
    }

    let suffix = 0;
    while (suffix < 10) {
      const username = suffix === 0 ? candidate : `${candidate}${suffix}`;
      const { data, error } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('username', username)
        .limit(1);

      if (error) {
        return username;
      }

      if (!data?.length) {
        return username;
      }

      suffix += 1;
    }

    return `${candidate}${Date.now().toString().slice(-4)}`;
  }

  async register(body: RegisterBody) {
    const email = body.email.trim().toLowerCase();
    const password = body.password;
    const passwordRepeat = body.passwordRepeat;

    if (!email || !password || !passwordRepeat) {
      throw new UnauthorizedException(
        'Bitte alle Felder vollständig ausfüllen.',
      );
    }

    if (password.length < 8) {
      throw new UnauthorizedException(
        'Das Passwort muss mindestens 8 Zeichen lang sein.',
      );
    }

    if (password !== passwordRepeat) {
      throw new UnauthorizedException(
        'Passwort und Wiederholung stimmen nicht überein.',
      );
    }

    const anonClient = this.createAnonClient();
    const { data, error } = await anonClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'authenticated',
        },
      },
    });

    if (error || !data.user?.id) {
      throw new UnauthorizedException(
        error?.message ?? 'Registrierung fehlgeschlagen.',
      );
    }

    const serviceClient = this.createServiceClient();
    if (serviceClient) {
      const emailPrefix = email.split('@')[0] ?? 'user';
      const username = await this.makeUniqueUsername(
        serviceClient,
        emailPrefix,
      );

      await serviceClient.from('profiles').upsert(
        {
          id: data.user.id,
          username,
          role: 'authenticated',
          email,
        } satisfies ProfileRow,
        { onConflict: 'id' },
      );

      await serviceClient.auth.admin.updateUserById(data.user.id, {
        user_metadata: {
          username,
          role: 'authenticated',
        },
      });
    }

    return {
      message:
        'Registrierung erfolgreich. Wenn E-Mail-Bestätigung aktiv ist, bestätige zuerst dein Postfach.',
      userId: data.user.id,
    };
  }

  private async resolveEmailFromIdentifier(identifier: string) {
    const normalized = identifier.trim().toLowerCase();

    if (normalized.includes('@')) {
      return normalized;
    }

    const serviceClient = this.createServiceClient();
    if (!serviceClient) {
      throw new UnauthorizedException(
        'Login per Benutzername benötigt SUPABASE_SERVICE_ROLE_KEY.',
      );
    }

    const { data, error } = await serviceClient
      .from('profiles')
      .select('email')
      .eq('username', normalized)
      .maybeSingle<{ email: string }>();

    if (error || !data?.email) {
      throw new UnauthorizedException(
        'Benutzername oder Passwort ist ungültig.',
      );
    }

    return data.email.toLowerCase();
  }

  private async getProfileIdentity(
    userId: string,
    serviceClient?: SupabaseClient | null,
  ): Promise<ProfileIdentity | null> {
    const client = serviceClient ?? this.createServiceClient();
    if (!client) {
      return null;
    }

    const { data, error } = await client
      .from('profiles')
      .select('username, role')
      .eq('id', userId)
      .maybeSingle<ProfileIdentity>();

    if (error || !data) {
      return null;
    }

    return data;
  }

  async login(body: LoginBody): Promise<LoginResult> {
    const username = body.username.trim();
    const password = body.password;

    if (!username || !password) {
      throw new UnauthorizedException(
        'Benutzername und Passwort sind erforderlich.',
      );
    }

    const email = await this.resolveEmailFromIdentifier(username);
    const anonClient = this.createAnonClient();
    const { data, error } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (
      error ||
      !data.session?.access_token ||
      !data.session.refresh_token ||
      !data.user?.id
    ) {
      throw new UnauthorizedException(
        'Benutzername oder Passwort ist ungültig.',
      );
    }

    const appMetadata = data.user.app_metadata as
      | Record<string, unknown>
      | undefined;
    const userMetadata = data.user.user_metadata as
      | Record<string, unknown>
      | undefined;
    const profileIdentity = await this.getProfileIdentity(data.user.id);
    const role =
      profileIdentity?.role ||
      (typeof appMetadata?.role === 'string' && appMetadata.role) ||
      (typeof userMetadata?.role === 'string' && userMetadata.role) ||
      'authenticated';
    const resolvedUsername =
      profileIdentity?.username ||
      (typeof userMetadata?.username === 'string' && userMetadata.username) ||
      username;

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
        username: resolvedUsername,
        role,
      },
    };
  }

  async me(accessToken?: string) {
    if (!accessToken) {
      return null;
    }

    const anonClient = this.createAnonClient();
    const { data, error } = await anonClient.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    const userMetadata = data.user.user_metadata as
      | Record<string, unknown>
      | undefined;
    const profileIdentity = await this.getProfileIdentity(data.user.id);
    const username =
      profileIdentity?.username ||
      (typeof userMetadata?.username === 'string' && userMetadata.username) ||
      data.user.email ||
      'user';
    const role =
      profileIdentity?.role ||
      (typeof userMetadata?.role === 'string' && userMetadata.role) ||
      'authenticated';

    return {
      id: data.user.id,
      email: data.user.email ?? null,
      username,
      role,
    };
  }
}
