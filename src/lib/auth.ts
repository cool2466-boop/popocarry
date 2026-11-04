import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const failures = new Map<string, { count: number; expires: number }>();
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  providers: [
    CredentialsProvider({
      name: '이메일', credentials: { email: { type: 'email' }, password: { type: 'password' } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password || credentials.password.length > 128) return null;
        const email = credentials.email.trim().toLowerCase();
        if (email.length > 254) return null;
        const bucket = failures.get(email);
        if (bucket && bucket.expires > Date.now() && bucket.count >= 10) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        const valid = await bcrypt.compare(credentials.password, user?.password || '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
        if (!user?.password || !valid) {
          if (failures.size > 10000) for (const [key, value] of failures) if (value.expires < Date.now()) failures.delete(key);
          failures.set(email, { count: bucket && bucket.expires > Date.now() ? bucket.count + 1 : 1, expires: bucket && bucket.expires > Date.now() ? bucket.expires : Date.now() + 15 * 60000 });
          return null;
        }
        failures.delete(email);
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })] : []),
    ...(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET ? [KakaoProvider({ clientId: process.env.KAKAO_CLIENT_ID, clientSecret: process.env.KAKAO_CLIENT_SECRET })] : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'credentials') return true;
      if (!account || !['google', 'kakao'].includes(account.provider)) return false;
      const identity = await prisma.oAuthIdentity.findUnique({ where: { provider_subject: { provider: account.provider, subject: account.providerAccountId } } });
      if (identity) { user.id = identity.userId; return true; }
      if (!user.email) return '/?authError=email_missing';
      const p = profile as { email_verified?: boolean; kakao_account?: { is_email_verified?: boolean; is_email_valid?: boolean } } | undefined;
      const verified = account.provider === 'google' ? p?.email_verified === true : account.provider === 'kakao' && p?.kakao_account?.is_email_verified === true && p?.kakao_account?.is_email_valid === true;
      if (!verified) return '/?authError=email_unverified';
      const email = user.email.toLowerCase();
      // Existing accounts must not be silently merged by email.
      if (await prisma.user.findUnique({ where: { email } })) return '/?authError=account_exists';
      const created = await prisma.user.create({ data: { email, name: user.name || '회원', identities: { create: { provider: account.provider, subject: account.providerAccountId } } } });
      user.id = created.id;
      return true;
    },
    async jwt({ token, user }) { if (user) token.sub = user.id; return token; },
    async session({ session, token }) { if (session.user && token.sub) (session.user as typeof session.user & { id: string }).id = token.sub; return session; },
  },
};
