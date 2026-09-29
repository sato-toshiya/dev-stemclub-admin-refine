# STE Admin (Refine)

## Project Overview

`ste-admin` is an internal admin frontend built with Refine + Ant Design, connected to Strapi backend.

Current maintained scope:

- Login
- School admins
- Academic years
- Classes
- Teachers
- Students
- Public pages: `/viewer/:token`, `/help`, `/privacy-policy`

Note: `works` module exists in codebase but is temporarily out of scope for this shortened handover.

## Tech Stack

- Refine: `@refinedev/core`, `@refinedev/antd`, `@refinedev/react-router`
- React 19 + TypeScript
- Ant Design 5
- Vite 6
- Axios
- i18next (default locale: `ja`)

## Prerequisites

- Node.js 18 (team standard)
- Yarn
- Running Strapi backend with required endpoints/resources

## Installation

```bash
yarn install --frozen-lockfile
cp .env.example .env
```

## Environment Variables

| Variable             | Required | Description                                                      | Example                     |
| -------------------- | -------- | ---------------------------------------------------------------- | --------------------------- |
| `VITE_API_URL`       | Yes      | Backend base URL (frontend appends `/api`)                       | `http://localhost:1337/`    |
| `VITE_VIEWER_ORIGIN` | Yes      | Origin/domain used by viewer iframe + postMessage security check | `https://admin.stemclub.jp` |

## Run Locally

```bash
yarn dev
```

- Default URL: `http://localhost:5173`
- Login uses Strapi account (no seed account in repo)

## Build

```bash
yarn build
```

- Output: `dist/`
- `VITE_*` variables are build-time variables

## Deploy

Server runtime is **PM2 + Nginx**.

### PM2

Configured in `ecosystem.config.cjs`:

```bash
npx serve -s dist -l 5173
```

### Nginx

Configured in `nginx.conf`:

- `/` -> `127.0.0.1:5173`
- `/admin/` -> `127.0.0.1:1337/admin/`

### CI/CD (GitLab)

`.gitlab-ci.yml` builds `dist/` then deploys via SSH + rsync to staging release folders and switches `current` symlink.

## Scripts

| Script         | Command               | Purpose                                                    |
| -------------- | --------------------- | ---------------------------------------------------------- |
| `dev`          | `refine dev`          | Local development                                          |
| `build`        | `tsc && refine build` | Production build                                           |
| `start`        | `refine start`        | Refine CLI start command (not used in current deploy flow) |
| `lint`         | `eslint .`            | Lint                                                       |
| `format`       | `prettier . --write`  | Format                                                     |
| `format:check` | `prettier . --check`  | Format check                                               |

## Project Structure (Important Paths)

- `src/App.tsx`: Refine root, providers, resources, routes
- `src/config/api.ts`: API + viewer env config
- `src/provider/authProvider.ts`: authProvider + axios instance
- `src/provider/accessControlProvider.ts`: role-based access control
- `src/strapiV5DataProvider.ts`: custom Strapi v5-compatible data provider
- `src/pages/*`: feature pages
- `public/templates/*`: import templates
- `.gitlab-ci.yml`, `ecosystem.config.cjs`, `nginx.conf`: deploy/runtime config

## Refine Architecture Notes

- `Refine` root is in `src/App.tsx`
- Router provider: `@refinedev/react-router`
- Data provider: custom `StrapiV5DataProvider(API_URL_WITH_API, axiosInstance)`
- Auth provider: `src/provider/authProvider.ts`
- Access control provider: `src/provider/accessControlProvider.ts`
- Notification provider: `useNotificationProvider` from `@refinedev/antd`
- i18n provider: custom wrapper around `i18next`
- Live provider: not implemented

## Operational Notes

- JWT is stored in localStorage key `strapi-jwt-token`
- Viewer host/origin is now env-driven via `VITE_VIEWER_ORIGIN`
- Backend contract is tightly coupled with Strapi custom endpoints
- Teacher/Student create flows now require selecting an academic year (`active` or `pending`) before class selection.

## Troubleshooting

- Always redirected to login:
  - check `VITE_API_URL`
  - verify backend auth endpoint
  - clear token in localStorage and login again
- Viewer does not work:
  - check `VITE_VIEWER_ORIGIN`
  - ensure backend `/projects/share/resolve` works
- Import errors:
  - use files in `public/templates/`
  - verify header columns
