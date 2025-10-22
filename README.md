# 分解力 (Decompo)

This monorepo captures the initial project structure, deployment scripts, and database bootstrap required to build the "分解力" product suite. The implementation follows the specification shared for the web H5 client, API gateway, and management admin panel.

## Repository layout

```
decompo/
├─ scripts/                   # Windows Server automation helpers
├─ apps/
│  ├─ web-h5/                 # Mobile web client (Vue 3 + Vite)
│  ├─ api/                    # Node.js API gateway
│  └─ admin/                  # Admin console (Vue 3 + Naive UI)
├─ packages/
│  ├─ shared-schemas/         # Shared JSON schema definitions
│  └─ shared-utils/           # Shared helpers (redaction, error codes, etc.)
├─ infra/
│  ├─ db/                     # SQLite initialization scripts and migrations
│  └─ nginx/                  # Optional reverse-proxy templates
├─ .env                       # Generated during deployment
└─ LICENSE
```

Each application will maintain its own `package.json` and Vite/Fastify configurations as implementation progresses.

## Deployment overview

Use `scripts/auto-deploy.bat` on Windows Server to orchestrate:

1. Node.js LTS installation (via winget)
2. PM2 installation and startup registration
3. Optional Nginx setup (download, configure, register via NSSM)
4. Interactive `.env` generation
5. Dependency installation (`npm install` in the root and sub-packages)
6. Frontend builds for `apps/web-h5` and `apps/admin`
7. SQLite initialization using `infra/db/init.sql`
8. PM2 process launch via `ecosystem.config.cjs`

## Database bootstrap

`infra/db/init.sql` provisions all baseline tables with extensible `extra JSON` columns to accommodate future schema evolution without immediate migrations.

## Next steps

* Populate each app and package directory with actual source code.
* Add configuration management and runtime scaffolding for Fastify, Vue apps, and shared packages.
* Define PM2 ecosystem configuration (`ecosystem.config.cjs`).
* Implement CI/CD and testing workflows as needed.
