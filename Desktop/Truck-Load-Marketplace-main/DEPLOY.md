# Deploying TruckLink to Vercel

The repo deploys as one Vercel project: the React client is built to static files
(`client/dist`) and the Express API runs as a single serverless function
(`api/index.js`, routed by `vercel.json`). Build and output settings come from
`vercel.json`, so no dashboard overrides are needed.

## 1. Import the project

Vercel dashboard → **Add New → Project → Import** `ObeyMuchechesi/Truck-Load-Marketplace`.
Keep the framework preset on **Other**; `vercel.json` supplies the build.

Or from the CLI:

```bash
npx vercel link      # create the project
npx vercel --prod    # production deployment
```

## 2. Environment variables (Production and Preview)

| Name              | Value                                                        |
| ----------------- | ------------------------------------------------------------ |
| `MONGODB_URI`     | `mongodb+srv://…/trucklink` (same string as `server/.env`)    |
| `JWT_SECRET`      | long random string, e.g. `openssl rand -hex 32`               |
| `CLIENT_URL`      | the project's Vercel URL, e.g. `https://trucklink.vercel.app` |
| `CREDITS_PER_PACK`| credits granted per purchased pack (default `20`)             |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PRICE_MONTHLY`, `PRICE_CREDIT_PACK` | optional, needed only for checkout |

Setting the secret key: **Project → Settings → Environment Variables**. Redeploy
after changing values; a deployment keeps the variables it was built with.

## 3. Allow Vercel to reach MongoDB Atlas

Atlas → **Network Access** → add `0.0.0.0/0`. Vercel functions have no fixed
egress IP, so without this the API answers
`{"error":"DB_UNAVAILABLE","reason":"CONNECTION_FAILED"}`.

## 4. Seed demo data

Run once from a machine that can reach the cluster (uses `server/.env`):

```bash
npm run seed
```

## 5. Verify

```bash
curl https://<project>.vercel.app/api/health
# {"ok":true,"db":"connected",...}
```

`db` must read `connected`. Then sign in with a seeded account, e.g.
`dispatch@savannah.test` / `Shipper@123` or `ops@kilimanjaro.test` / `Carrier@123`.

## Notes

- The API connects lazily and caches the mongoose connection between invocations
  (`api/index.js`), so cold starts are the only slow requests.
- Stripe webhooks must be mounted at `https://<project>.vercel.app/api/webhooks/stripe`
  and point at the same `STRIPE_WEBHOOK_SECRET`.
- Anonymous (`vercel deploy --temporary`) deployments do **not** receive runtime
  environment variables; they are only useful for checking the static client.
