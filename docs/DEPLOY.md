# DeepTrail Production Deployment Runbook

DeepTrail should be deployed on a host that preserves Next.js response headers. The current first-choice path is Vercel because it can import the existing GitHub repository as a Next.js project without converting the app to a static export.

No environment variables or paid APIs are required by DeepTrail itself.

## 1. Deploy the current `main` branch

### Vercel dashboard path

1. Sign in to Vercel.
2. Create a new project and import `AaryaMody1301/deeptrail-webmcp` from GitHub.
3. Keep the detected **Next.js** framework preset and project root `./`.
4. Use Node.js 22 or later.
5. Deploy the `main` branch.
6. Keep the generated production URL public; do not enable deployment protection for the submission URL.

### CLI path

If the Vercel CLI is already authenticated:

```bash
npm ci
npm run test
npm run typecheck
npm run build
vercel deploy --prod
```

Do not commit Vercel tokens or `.vercel` account metadata.

## 2. Verify ordinary HTTP access

Replace the placeholder with the production origin.

```bash
export DEEPTRAIL_URL="https://YOUR-PRODUCTION-ORIGIN"
curl -I "$DEEPTRAIL_URL/"
curl -I "$DEEPTRAIL_URL/judge"
```

Both routes must return a successful public response without authentication.

## 3. Verify WebMCP-required response behavior

The current `next.config.ts` emits these headers on every route:

```text
Origin-Agent-Cluster: ?1
Permissions-Policy: tools=(self), camera=(), microphone=(), geolocation=()
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

Verify the production response rather than assuming the host preserved local behavior:

```bash
curl -sI "$DEEPTRAIL_URL/" | grep -i -E 'origin-agent-cluster|permissions-policy|x-content-type-options|referrer-policy'
```

Expected critical lines include:

```text
Origin-Agent-Cluster: ?1
Permissions-Policy: tools=(self), camera=(), microphone=(), geolocation=()
```

The `/judge` page also performs these checks in-browser and shows them as readiness cards.

## 4. Verify production WebMCP in ChatGPT

1. Open `https://YOUR-PRODUCTION-ORIGIN/judge` in ChatGPT's in-app browser.
2. Confirm **Secure context** is Ready.
3. Confirm **WebMCP browser capability** is Ready.
4. Confirm **Origin isolation header** and **Tools permissions policy** are Ready.
5. Click **Load evidence-backed judge demo**.
6. Confirm the workspace reports the expected WebMCP tool count once claims are present.
7. Copy the exact judge prompt from `/judge` and run it.
8. Confirm at least one agent mutation appears immediately in the DeepTrail UI with actor attribution.

## 5. Verify Chrome 149+

1. Install Chrome 149 or later.
2. Open `chrome://flags/#enable-webmcp-testing`.
3. Enable the flag and relaunch Chrome.
4. Open the production `/judge` URL.
5. Repeat the seeded-demo and exact-prompt flow.

## 6. Clean-profile rehearsal

Use a fresh browser profile or clear DeepTrail site data before this rehearsal.

Done when:

- `/judge` loads without console-visible application errors.
- The seeded investigation loads in one click.
- Refresh preserves the workspace through IndexedDB.
- Evidence graph renders and remains keyboard accessible.
- The agent can read workspace context and mutate it through WebMCP.
- The visible result matches the behavior shown in the final video.
- Exported JSON backup can be downloaded and imported again.

See `docs/TEST_MATRIX.md` for the broader manual release matrix.

## 7. Submission freeze

Before the deadline, record the exact production URL, Git commit SHA, Devpost copy, and YouTube URL in `docs/SUBMISSION.md` or a private submission checklist.

After **September 3, 2026 at 1:00 PM PT**, do not modify the submitted Devpost entry, repository, or live deployment during judging. If development must continue, work from a separate fork/copy while leaving the submitted version unchanged.
