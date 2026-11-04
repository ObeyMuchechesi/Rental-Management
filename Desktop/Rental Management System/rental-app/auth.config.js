/**
 * Base auth config — deliberately free of Node-only imports (mongoose/bcrypt)
 * so it can run inside middleware on the Edge runtime.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId ?? null;
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.uid;
      session.user.role = token.role;
      session.user.tenantId = token.tenantId ?? null;
      return session;
    },
  },
};
