# Frontend API environment configuration

Every frontend build must explicitly set these public, non-secret values:

| Deployment | `NEXT_PUBLIC_APP_ENV` | `NEXT_PUBLIC_API_URL` |
| --- | --- | --- |
| Local development | `development` | Local API origin, for example `http://localhost:4000` |
| Staging | `staging` | HTTPS staging API origin |
| Production | `production` | HTTPS production API origin configured by the deployment |

The API URL is an origin only: do not include credentials, an `/api` path, query, or fragment. The frontend build fails with a setup message when either setting is missing or invalid. Development must use a loopback host; staging must use HTTPS and cannot use the known production API hosts; production must use an explicit HTTPS origin. No API URL fallback is used.

These `NEXT_PUBLIC_*` values are embedded in client bundles and must never contain credentials or server-only secrets. Configure them in the local developer environment or the matching staging/production deployment environment. Do not copy a production `.env` file into a test snapshot.
