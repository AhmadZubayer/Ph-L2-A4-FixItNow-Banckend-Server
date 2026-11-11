# Deploy to Vercel

Run commands from the backend repository root. The existing configuration uses
`api/index.js` to export the bundled Express application, while `npm start` uses
the separate local server bundle. See [the complete setup guide](../deploy_fix.md).

## Local verification

Use the same Node.js major version locally and in Vercel. Install dependencies
with `npm ci`, configure `.env` using `.env.example`, then run:

```sh
npm run check:deploy
```

This generates Prisma, builds both ESM bundles, checks TypeScript, imports the
actual Vercel handler in production mode, and checks the root response, Swagger
page, CSS, JavaScript, and loaded service moderation documentation. It requires
the application's environment configuration, including a Stripe secret key.
It does not query or modify the database and does not verify Vercel packaging.

## Vercel project settings

- Root Directory: this backend repository's root, containing `package.json`.
- Framework Preset: Other (`framework: null`).
- Build Command: `npm run build`.
- Output Directory: `public`.
- Production Branch: `main`.
- Install development dependencies during the build; Prisma's CLI is a build dependency.

Keep `public/.gitkeep` tracked. `vercel.json` packages `dist`, Swagger comment
source files, and Swagger UI assets with the function. Generated bundles and
Prisma output remain ignored by Git.

## Environment and database

Configure Production environment variables from `.env.example`: set
`NODE_ENV=production`, the hosted `DATABASE_URL`, frontend `APP_URL`, deployed
backend `SERVER_URL`, bcrypt rounds, JWT secrets and expiry values, and Stripe
secret and webhook signing keys. `PORT` is only needed for local startup.
`STRIPE_PRODUCT_PRICE_ID` is currently unused; admin credentials are for optional
seeding. Use separate test configuration for Preview deployments.

Before deploying this revision, deliberately select the intended database through
`DATABASE_URL` in your migration environment and run:

```sh
npm run db:deploy
```

The service approval and admin pause migrations must be applied before the new
routes receive traffic. Prisma generation does not apply migrations. Keep
migrations separate from the normal Vercel build; do not automatically seed an
existing database.

## Verify after deployment

Confirm successful function packaging in Vercel's build logs. Check `/`,
`/docs/`, `/docs/swagger-ui.css`, `/health`, and `/api/categories`. `/health`
returns 200 when the database is reachable and 503 when it is unavailable.
Verify CORS from the configured frontend origin and inspect runtime logs.
Configure Stripe to send signed events to `/api/payments/webhook` and verify
payments in test mode. Redeploy after changing Vercel environment variables.
