# Decompo Monorepo

This repository hosts the complete "分解力" (Decompo) platform, including the mobile web client, API gateway, and administrative console. The project is organised as an npm workspace monorepo and targets Windows Server deployments without containers.

## Structure

```
decompo/
├─ scripts/                # Windows deployment helpers
├─ apps/
│  ├─ web-h5/              # End-user mobile web client (Vue 3)
│  ├─ api/                 # API gateway (Fastify + SQLite)
│  └─ admin/               # Admin console (Vue 3 + Naive UI)
├─ packages/
│  ├─ shared-schemas/      # Shared JSON schema definitions
│  └─ shared-utils/        # Common utilities (redaction, error helpers)
└─ infra/
   ├─ db/                  # SQLite init scripts and migrations
   └─ nginx/               # Optional reverse proxy templates
```

## Tooling

- Node.js >= 18
- npm workspaces
- TypeScript for the API project
- Vite for front-end applications

Refer to `scripts/auto-deploy.bat` for the automated Windows deployment entry point.
