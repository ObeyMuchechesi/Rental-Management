import { auth } from "./auth";
import { connectDB } from "./db";
import { Tenant, User } from "@/models";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Returns the session user or throws 401. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "Not signed in");
  return session.user;
}

/**
 * Tenancy record behind a signed-in tenant account.
 *
 * The session token is stamped at sign-in, so a tenancy the landlord assigns
 * afterwards would otherwise stay invisible until the tenant signs out and
 * back in. Resolve it from the database on every request instead, linking the
 * account by email when it isn't attached to a tenancy yet.
 */
export async function currentTenantId(user) {
  if (user?.role !== "tenant") return null;
  await connectDB();

  const account = await User.findById(user.id).select("tenant email").lean();
  if (!account) return null;

  if (account.tenant && (await Tenant.exists({ _id: account.tenant }))) {
    return account.tenant.toString();
  }

  const tenant = await Tenant.findOne({ email: account.email }).sort({ createdAt: -1 }).select("_id").lean();
  if (!tenant) return null;

  await User.updateOne({ _id: account._id }, { $set: { tenant: tenant._id } });
  return tenant._id.toString();
}

/** Returns the session user only when they are a landlord, else throws. */
export async function requireLandlord() {
  const user = await requireUser();
  if (user.role !== "landlord") throw new HttpError(403, "Landlord access required");
  return user;
}

export function json(data, status = 200) {
  return Response.json(data, { status });
}

/** Wraps a handler so thrown HttpErrors become clean JSON responses. */
export function route(handler) {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error("[api]", err);
      return json({ error: err?.message || "Internal server error" }, 500);
    }
  };
}

/** Validates required mongoose keys and throws 400 with a readable message. */
export function assert(body, keys) {
  const missing = keys.filter((k) => body?.[k] === undefined || body[k] === "" || body[k] === null);
  if (missing.length) throw new HttpError(400, `Missing required field(s): ${missing.join(", ")}`);
}
