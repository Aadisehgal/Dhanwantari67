import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no bcrypt, no Prisma) - used by middleware.ts,
// which runs on the Edge Runtime and cannot use Node.js-only packages like
// bcryptjs. The Credentials provider (which needs bcrypt + Prisma) is added
// separately in lib/auth.ts, which runs in the Node.js runtime only.
export default {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.branchId = (user as any).branchId;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).branchId = token.branchId as string | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
