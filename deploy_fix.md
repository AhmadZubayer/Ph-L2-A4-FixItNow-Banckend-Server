# FixItNow backend: deployment steps

Follow these steps after completing the application. Run commands from `FixItNow-backend-server`, the folder containing `package.json`. This guide uses the project's ESM + tsup bundle setup and GitHub-connected Vercel deployment.

## 1. Install the build tool

Run:

```sh
npm install tsup
```

Keep the existing TypeScript, tsx, Prisma, and application dependencies. Commit both `package.json` and `package-lock.json` when dependencies change.

## 2. Configure package.json

Keep `"type": "module"` and configure these scripts. Merge them into the existing file; do not replace the other dependencies or metadata.

```json
"type": "module",
"scripts": {
  "start": "node dist/server.js",
  "dev": "tsx watch ./src/server.ts",
  "postinstall": "prisma generate",
  "build": "prisma generate && tsup",
  "db:deploy": "prisma migrate deploy",
  "db:seed": "tsx prisma/seed.ts"
}
```

- `dev` runs the TypeScript server during development.
- `build` generates the Prisma client and bundles the application.
- `start` runs the compiled local server.
- `postinstall` generates Prisma's client after dependencies are installed. Generation also runs in `build`, so the build explicitly ensures the client exists.
- `db:deploy` applies existing migration files to the database selected by `DATABASE_URL`. Client generation does not apply database migrations.

Use `prisma generate && tsup` as the build command, replacing any earlier `tsc`-only build script.

## 3. Create tsup.config.ts in the project root

Use:

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts", "src/app.ts"],
  format: ["esm"],
  target: "esnext",
  outDir: "dist",
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: true,

  banner: {
    js: `
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
`,
  },
});
```

- Include both entry files: `server.ts` produces the local startup bundle; `app.ts` produces the Express handler bundle for Vercel.
- Keep the output format as `esm` only. The `import.meta.url` banner belongs to the ESM output; do not copy the earlier `format: ["esm", "cjs"]` example from `deploy.txt`.
- Keep `bundle: true` so local imports are resolved into the generated bundles.
- Keep `splitting: false` to avoid shared output chunks for these entries.
- The banner provides `require` for code that needs CommonJS loading within the ESM bundle.

Keep your source files as `.ts`. With this bundled deployment approach, existing local imports such as `./config` can remain unchanged. Vercel must load the bundle rather than execute those unbundled imports directly.

## 4. Check tsconfig.json

Keep the project's current compiler settings, including:

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023"
  },
  "include": ["src/**/*"],
  "exclude": []
}
```

This is a relevant-settings excerpt, not a replacement for the complete file. Retain the existing strictness, type, and other compiler options. `tsup` performs the deployment bundling; its successful build alone does not prove that TypeScript type checking passes.

## 5. Keep app creation separate from local startup

In `src/app.ts`:

1. Create the Express app.
2. Register middleware, routes, Swagger, and error handlers.
3. End the file with:

```ts
export default app;
```

Keep `app.listen(...)` in `src/server.ts`, where local startup already connects Prisma and starts the server. Do not import `server.ts` into the Vercel handler.

The resulting files have these roles:

| File | Role |
| --- | --- |
| `src/app.ts` | Express application and default export |
| `src/server.ts` | Local process startup and port listener |
| `dist/app.js` | Generated app bundle used by Vercel |
| `dist/server.js` | Generated startup bundle used by `npm start` |

The Vercel app entry does not run the explicit `$connect()` in `server.ts`; Prisma can establish a connection when a database query is made. Verify a database-backed route after deployment.

## 6. Create api/index.js

Create an `api` directory in the project root, then create `api/index.js`:

```js
// Vercel serves the compiled app; server.ts remains the local startup entry.
export { default } from "../dist/app.js";
```

Use `.js` for this small entry file. Its import points to the actual JavaScript bundle produced by `npm run build`.

## 7. Create public/.gitkeep

Create a `public` directory in the project root and place an empty `.gitkeep` file inside it:

```text
public/
  .gitkeep
```

Git does not track empty directories. The placeholder ensures that the `public` directory exists when Vercel clones the repository.

This setup uses `public` as its static output directory. Without that folder, the build can successfully generate the backend bundles and still fail with `STATIC_BUILD_NO_OUT_DIR`.

Keep backend bundles in `dist`; do not use `dist` as the public static output directory.

## 8. Create or replace vercel.json

Use this complete configuration in the project root:

```json
{
  "version": 2,
  "framework": null,
  "buildCommand": "npm run build",
  "outputDirectory": "public",
  "functions": {
    "api/index.js": {
      "includeFiles": "{dist/**,src/modules/**/*.docs.ts,node_modules/swagger-ui-dist/**}"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ]
}
```

1. Use `framework: null` for this custom build and function setup.
2. Run `npm run build` to generate Prisma and the bundles before function packaging.
3. Use `public` for static output.
4. Package the generated `dist` files with `api/index.js`.
5. Include `src/modules/**/*.docs.ts` because `swagger.ts` reads those files to generate the API specification at runtime.
6. Include `swagger-ui-dist` assets for the documentation interface.
7. Rewrite incoming paths to the Express function, which handles the application routes.

Remove the old `builds` and `routes` configuration targeting `src/server.ts` or `dist/server.js`. Do not combine that old configuration with this one. Serving unbundled source was what exposed unsupported directory imports such as `./config` to Node's ESM loader.

## 9. Check production logging

In `src/lib/pino_logger.ts`, keep the existing production check:

```ts
const isProduction = process.env.NODE_ENV === "production";
```

Use plain Pino logging in production. Enable the `pino-pretty` transport only outside production, as the current file already does. Set `NODE_ENV=production` in the deployed environment.

## 10. Check .gitignore

Keep these generated files and local configuration out of Git:

```gitignore
node_modules/
dist/
generated/
logs/
.env
.env.production
```

If you use the Vercel CLI, also ignore `.vercel/`, which stores local project-link information.

Commit `api/index.js`, `public/.gitkeep`, `tsup.config.ts`, `vercel.json`, package files, Prisma schema files, and migration files. Vercel generates `dist` and the Prisma client during installation/build; do not commit them to compensate for a missing build step.

## 11. Verify the build locally

Run:

```sh
npm run build
```

Confirm that the command completes successfully and generates:

```text
dist/app.js
dist/server.js
```

With your local environment configured, run:

```sh
npm start
```

Check `/`, `/docs/`, and `/docs/swagger-ui.css` on the configured local port. Stop the local server when finished.

To also verify that the exact Vercel entry imports successfully, run:

```sh
node --input-type=module -e "import('./api/index.js').then(({default: app}) => console.log('Handler type:', typeof app))"
```

Expect `Handler type: function`. This import check does not test database connectivity or Vercel's full packaging process.

## 12. Prepare the hosted database and environment variables

Provision a PostgreSQL database reachable from Vercel. In Vercel's project environment settings, configure the values used by this application:

| Variable | What to configure |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Hosted PostgreSQL connection string |
| `SERVER_URL` | Deployed backend's base URL; used by payment return URLs |
| `APP_URL` | Frontend origin allowed by the current CORS configuration |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds, matching the application's intended setting |
| `JWT_ACCESS_SECRET` | Access-token signing secret |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret |
| `JWT_ACCESS_EXPIRES_IN` | Access-token expiry supported by the app |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token expiry supported by the app |
| `STRIPE_SECRET_KEY` | Stripe secret key for the intended test/live environment |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the deployed webhook endpoint |
| `STRIPE_PRODUCT_PRICE_ID` | Stripe price ID if used by the configured payment flow |

`PORT` is used by the local `server.ts` listener; the exported Vercel handler does not need a manually assigned listening port.

Apply variables to Production and to Preview if you want preview deployments to work. Use appropriate separate test values for preview environments. Keep actual secrets out of this guide and Git.

With `DATABASE_URL` deliberately set to the intended hosted database in your migration environment, run:

```sh
npm run db:deploy
```

This applies committed migrations and changes that database. Confirm the target before running it. Do not add automatic seeding to every deployment; run seeds only when the target database needs the project's initial data.

## 13. Connect GitHub to Vercel

1. Commit and push the prepared deployment files to the GitHub repository.
2. In Vercel, import the repository, or use the existing connected project.
3. Set the Root Directory to the folder containing `package.json`, `vercel.json`, and `api/`. For this backend repository, those files are at the repository root.
4. Use the Other framework preset, consistent with `framework: null`.
5. Confirm the effective build command is `npm run build` and output directory is `public`, as specified in `vercel.json`.
6. Use a supported Node.js version compatible with the project's dependencies; keep local and deployed major versions aligned where possible.
7. Set the production branch to `main`.
8. Add the environment variables from step 12, then deploy.

For an existing repository, review `git status`, stage the intended deployment files, commit, and push. Future pushes to the connected production branch trigger deployments.

## 14. Optional: deploy the same setup through the Vercel CLI

If you choose CLI deployment instead of a Git-triggered deployment, run from the backend root:

```sh
npm install -g vercel
vercel login
vercel link
vercel --prod
```

Select the existing Vercel project when linking. Keep the same environment settings and configuration files. Use two ordinary hyphens in `--prod`; do not copy a typographic dash from formatted notes.

## 15. Verify the deployed application

1. Check the build logs for successful Prisma generation and both tsup bundles.
2. Confirm function packaging and deployment finish successfully; `Build success` from tsup alone is not the final deployment result.
3. Open the deployed `/` endpoint and check for the FixItNow response.
4. Open `/docs/` and verify that the interface, CSS, and documented operations load.
5. Call a read-only database-backed endpoint, such as `/api/categories`, to verify database connectivity and migrations.
6. Test the frontend origin against the API to verify CORS settings.
7. Configure Stripe's webhook URL to the deployed `/api/payments/webhook` endpoint and set its signing secret in Vercel. Test the payment flow in Stripe test mode before using live payments.
8. If you changed environment variables after a deployment, redeploy so the new deployment uses them.
9. Check runtime logs for any remaining errors. A successful build does not guarantee valid database credentials, JWT settings, or Stripe configuration.
