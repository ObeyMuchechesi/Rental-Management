import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { connectDB } from "./db";
import { User } from "@/models";
import { encryptPassword } from "./crypto";
import { ensureAdmin } from "./bootstrap";

class PendingApproval extends CredentialsSignin {
  code = "pending";
}

class AccountRejected extends CredentialsSignin {
  code = "rejected";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        await ensureAdmin();
        await connectDB();
        const user = await User.findOne({ email: String(creds.email).toLowerCase() }).lean();
        if (!user) return null;
        const ok = await bcrypt.compare(String(creds.password), user.passwordHash);
        if (!ok) return null;

        // Tenants need the landlord's approval before they can sign in.
        if (user.status === "pending") throw new PendingApproval();
        if (user.status === "rejected") throw new AccountRejected();

        // Accounts created before the password vault existed get it filled in
        // on their first successful sign-in, so the owner can view it later.
        if (!user.passwordEnc) {
          await User.updateOne({ _id: user._id }, { passwordEnc: encryptPassword(creds.password) });
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenant?.toString() ?? null,
        };
      },
    }),
  ],
});
