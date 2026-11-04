import { auth } from "./auth";

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
