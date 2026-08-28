# DeepTrail Production Deployment Runbook

DeepTrail is deployed on Netlify, which preserves the Next.js response headers required for the WebMCP judge flow. The existing GitHub repository is connected to the existing Netlify site; do not create a second site or change hosts.

Production: `https://deeptrail-webmcp.netlify.app`
Judge: `https://deeptrail-webmcp.netlify.app/judge`
Netlify site ID: `73752605-6358-4e69-94eb-0fa2140ba659`

No environment variables or paid APIs are required by DeepTrail itself.

## 1. Deploy the current `main` branch to the existing Netlify site

### Netlify dashboard path

1. Open the existing Netlify site for `AaryaMody1301/deeptrail-webmcp`.
2. Keep the detected **Next.js** framework preset and project root `./`.
3. Use Node.js 22 or later.
4. Deploy the `main` branch to the existing production site.
5. Keep the production URL public; do not enable SSO, team-login, or password protection for the submission URL.

### CLI path

If the Netlify CLI is already authenticated, run this from a clean checkout of the exact green `main` commit:

```bash
npm ci
npm run test
npm run typecheck
npm run build
git status --short
git rev-parse HEAD
npx netlify status
npx netlify deploy --prod --site 73752605-6358-4e69-94eb-0fa2140ba659
```

Record the printed deployment URL and commit SHA. The deployment must be created from the verified commit, not from an uncommitted working tree.

Do not commit Netlify tokens or `.netlify` account metadata.

## 2. Verify ordinary HTTP access

Use the verified production origin.

```bash
export DEEPTRAIL_URL="https://deeptrail-webmcp.netlify.app"
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

1. Open `https://deeptrail-webmcp.netlify.app/judge` in ChatGPT's in-app browser.
2. Confirm **Secure context** is Ready.
3. Confirm **WebMCP browser capability** is Ready.
4. Confirm **Origin isolation header** and **Tools permissions policy** are Ready.
5. Click **Load evidence-backed judge demo**.
6. Confirm the workspace reports the expected WebMCP tool lifecycle: 1 tool with no workspace, 9 with an active workspace and no claims, and 11 once claims exist.
7. Copy the exact judge prompt from `/judge` and run it.
8. Confirm at least one agent mutation appears immediately in the DeepTrail UI with actor attribution.

## 5. Verify Chrome 149+

1. Install Chrome 149 or later.
2. Open `chrome://flags/#enable-webmcp-testing`.
3. Enable the flag and relaunch Chrome.
4. Open `https://deeptrail-webmcp.netlify.app/judge`. Current Chrome should expose `document.modelContext`; DeepTrail only checks `navigator.modelContext` as a legacy Chrome 149 fallback.
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

Before the deadline, record the exact Netlify production URL, Git commit SHA, Devpost copy, and YouTube URL in `docs/SUBMISSION.md` or a private submission checklist.

After **September 3, 2026 at 1:00 PM PT**, do not modify the submitted Devpost entry, repository, or live deployment during judging. If development must continue, work from a separate fork/copy while leaving the submitted version unchanged.
