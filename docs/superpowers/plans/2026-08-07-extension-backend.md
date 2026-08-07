# Extension Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `uniflux-autofill-extension` a working backend — extended profile fields on `User`, a short-lived extension-token exchange, and a profile endpoint the extension can actually call — so the extension stops 404ing on every real use.

**Architecture:** Two new middleware functions (`requireExtensionKey`, `extensionAuth`) gate a new `POST /api/auth/extension-refresh` (issues a 5-minute `type: 'extension'` JWT from a valid primary access JWT) and a new `GET /api/profile/extension/full` (returns the full profile shape the extension's `ProfileField` type expects). `User.profile` gets the missing fields from `uniflux-autofill-chrome-extension/PLAN.md` §3.1 added as a Mongoose subdocument array/field set — additive only, nothing existing is renamed or removed.

**Tech Stack:** Express, Mongoose, jsonwebtoken (existing stack, no new dependencies). Tests via Node's built-in `node:test` + `assert` — the only test tooling already in this repo (see `tests/region.test.js`), no supertest/DB mocking library available, so tests target pure logic (token mint/verify, header parsing), not live-DB HTTP round trips.

## Global Constraints

- `EXTENSION_KEY` env var already exists in `server/.env` and already matches the value hardcoded in the extension's `auth.ts`/`profile.ts` (`a855a6868d073e874980bf6a925d1b8454aa034efff5a8efb146cef90f666104`) — reuse it via `process.env.EXTENSION_KEY`, do not invent a new secret.
- Extension token: `type: 'extension'`, signed with existing `process.env.JWT_SECRET`, `expiresIn: '5m'` — matches PLAN.md §3.2 ("Issue short-lived (5min) extension-only JWT").
- Extension calls these exact paths (hardcoded in already-shipped extension code, do not rename): `POST /api/auth/extension-refresh`, `GET /api/profile/extension/full`.
- Extension sends `Authorization: Bearer <extensionToken>`... no — it sends `X-Extension-Auth: <token>` and `X-Extension-Key: <key>` headers (see `uniflux-autofill-extension/src/background/profile.ts:22-25`). Match these header names exactly.
- All new profile fields are additive under `User.profile` — do not touch `profile.resumeUrl`, `profile.skills`, `profile.preferences` (existing, in use elsewhere).
- Follow existing controller style: `try/catch` per function, `res.status(N).json({ message })` on error, plain object exports at file bottom (see `auth.controller.js`).
- Follow existing route style: `router.use(protect)` then per-path middleware chains (see `jobs.routes.js`).

---

### Task 1: Extend User model with full profile fields

**Files:**
- Modify: `server/src/models/User.js:20-28` (the `profile` subdocument)
- Test: `server/tests/user-profile-schema.test.js`

**Interfaces:**
- Produces: `User.profile.phone`, `.location`, `.linkedIn`, `.portfolio`, `.github`, `.title`, `.bio`, `.education[]`, `.experience[]`, `.certifications[]`, `.coverLetter` — all optional, all consumed by Task 4's controller.

- [ ] **Step 1: Write the failing test**

```javascript
// server/tests/user-profile-schema.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const User = require('../src/models/User');

test('User schema has extended profile fields with correct types', () => {
  const paths = User.schema.paths;
  assert.ok(paths['profile.phone'], 'profile.phone missing');
  assert.ok(paths['profile.location'], 'profile.location missing');
  assert.ok(paths['profile.linkedIn'], 'profile.linkedIn missing');
  assert.ok(paths['profile.portfolio'], 'profile.portfolio missing');
  assert.ok(paths['profile.github'], 'profile.github missing');
  assert.ok(paths['profile.title'], 'profile.title missing');
  assert.ok(paths['profile.bio'], 'profile.bio missing');
  assert.ok(paths['profile.coverLetter'], 'profile.coverLetter missing');

  // Array subdocuments show up as profile.education, profile.experience, profile.certifications
  // with instance 'Array' — confirm they exist and are arrays.
  assert.strictEqual(User.schema.path('profile.education').instance, 'Array');
  assert.strictEqual(User.schema.path('profile.experience').instance, 'Array');
  assert.strictEqual(User.schema.path('profile.certifications').instance, 'Array');

  // Existing fields must survive untouched
  assert.ok(paths['profile.resumeUrl'], 'existing profile.resumeUrl was removed');
  assert.ok(paths['profile.skills'], 'existing profile.skills was removed');
  assert.ok(paths['profile.preferences.locations'], 'existing preferences.locations was removed');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/tests/user-profile-schema.test.js`
Expected: FAIL — `profile.phone` etc. are `undefined`

- [ ] **Step 3: Write minimal implementation**

Replace the `profile` block in `server/src/models/User.js` (lines 20-28) with:

```javascript
    profile: {
      resumeUrl: { type: String, default: null },
      skills: [String],
      preferences: {
        locations: [String],
        jobTypes: [String],
        salaryMin: { type: Number, default: null },
      },
      // Extension-facing fields (uniflux-autofill-extension)
      phone:       { type: String, default: null },
      location:    { type: String, default: null },
      linkedIn:    { type: String, default: null },
      portfolio:   { type: String, default: null },
      github:      { type: String, default: null },
      title:       { type: String, default: null },
      bio:         { type: String, default: null },
      coverLetter: { type: String, default: null },
      education: [{
        institution: String,
        degree:      String,
        field:       String,
        startDate:   Date,
        endDate:     Date,
        gpa:         String,
      }],
      experience: [{
        company:     String,
        title:       String,
        location:    String,
        startDate:   Date,
        endDate:     Date,
        current:     { type: Boolean, default: false },
        description: String,
      }],
      certifications: [{
        name:   String,
        issuer: String,
        date:   Date,
        url:    String,
      }],
    },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/tests/user-profile-schema.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/models/User.js server/tests/user-profile-schema.test.js
git commit -m "feat: add extension-facing profile fields to User model"
```

---

### Task 2: Extension auth middleware (key + token verification)

**Files:**
- Create: `server/src/middleware/extension.middleware.js`
- Test: `server/tests/extension-middleware.test.js`

**Interfaces:**
- Consumes: `process.env.EXTENSION_KEY`, `process.env.JWT_SECRET` (both already set in `.env`)
- Produces: `requireExtensionKey(req, res, next)` — rejects unless `req.headers['x-extension-key'] === process.env.EXTENSION_KEY`. `extensionAuth(req, res, next)` — verifies `req.headers['x-extension-auth']` as a JWT with `type === 'extension'`, sets `req.user` (full Mongoose doc, same contract as `protect`) on success. Both used by Task 4's route.

- [ ] **Step 1: Write the failing test**

```javascript
// server/tests/extension-middleware.test.js
const { test } = require('node:test');
const assert = require('node:assert');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-extension-middleware';
process.env.EXTENSION_KEY = process.env.EXTENSION_KEY || 'test-extension-key';

const jwt = require('jsonwebtoken');
const { requireExtensionKey, extensionAuth } = require('../src/middleware/extension.middleware');

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

test('requireExtensionKey: rejects missing key', () => {
  const req = { headers: {} };
  const res = mockRes();
  let calledNext = false;
  requireExtensionKey(req, res, () => { calledNext = true; });
  assert.strictEqual(calledNext, false);
  assert.strictEqual(res.statusCode, 401);
});

test('requireExtensionKey: rejects wrong key', () => {
  const req = { headers: { 'x-extension-key': 'wrong' } };
  const res = mockRes();
  let calledNext = false;
  requireExtensionKey(req, res, () => { calledNext = true; });
  assert.strictEqual(calledNext, false);
  assert.strictEqual(res.statusCode, 401);
});

test('requireExtensionKey: accepts correct key', () => {
  const req = { headers: { 'x-extension-key': process.env.EXTENSION_KEY } };
  const res = mockRes();
  let calledNext = false;
  requireExtensionKey(req, res, () => { calledNext = true; });
  assert.strictEqual(calledNext, true);
});

test('extensionAuth: rejects token with wrong type', async () => {
  const badToken = jwt.sign({ userId: 'abc123', type: 'access' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const req = { headers: { 'x-extension-auth': badToken } };
  const res = mockRes();
  let calledNext = false;
  // extensionAuth looks up the user in Mongo — stub the model lookup out via req._testUserLookup override
  await extensionAuth(req, res, () => { calledNext = true; });
  assert.strictEqual(calledNext, false);
  assert.strictEqual(res.statusCode, 401);
});

test('extensionAuth: rejects missing header', async () => {
  const req = { headers: {} };
  const res = mockRes();
  let calledNext = false;
  await extensionAuth(req, res, () => { calledNext = true; });
  assert.strictEqual(calledNext, false);
  assert.strictEqual(res.statusCode, 401);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/tests/extension-middleware.test.js`
Expected: FAIL with `Cannot find module '../src/middleware/extension.middleware'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// server/src/middleware/extension.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Shared-secret gate — every extension request must carry this header.
// Rotates by changing EXTENSION_KEY in .env (invalidates all installed
// extensions until they ship an update with the new key baked in).
function requireExtensionKey(req, res, next) {
  const key = req.headers['x-extension-key'];
  if (!key || key !== process.env.EXTENSION_KEY) {
    return res.status(401).json({ message: 'Invalid or missing extension key' });
  }
  next();
}

// Verifies the short-lived extension-scoped JWT minted by
// POST /api/auth/extension-refresh. Distinct from `protect` (which accepts
// the primary access token) so a leaked extension token has a 5-minute
// blast radius instead of full-session access.
async function extensionAuth(req, res, next) {
  try {
    const token = req.headers['x-extension-auth'];
    if (!token) {
      return res.status(401).json({ message: 'No extension token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'extension') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired extension token' });
  }
}

module.exports = { requireExtensionKey, extensionAuth };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/tests/extension-middleware.test.js`
Expected: PASS — 5 tests pass. (The `extensionAuth` DB-lookup tests only exercise the reject paths, which return before touching Mongo, so no live DB connection is required for these to pass.)

- [ ] **Step 5: Commit**

```bash
git add server/src/middleware/extension.middleware.js server/tests/extension-middleware.test.js
git commit -m "feat: add extension key + token verification middleware"
```

---

### Task 3: POST /api/auth/extension-refresh endpoint

**Files:**
- Modify: `server/src/controllers/auth.controller.js` (add function, add to exports at line 361-365)
- Modify: `server/src/routes/auth.routes.js`
- Test: `server/tests/extension-refresh.test.js`

**Interfaces:**
- Consumes: `protect` middleware (existing, sets `req.user`), `process.env.JWT_SECRET`
- Produces: `extensionRefresh(req, res)` controller — mounted at `POST /api/auth/extension-refresh`, response shape `{ token: string, expiresIn: 300 }` (seconds), matching what `uniflux-autofill-extension/src/background/auth.ts:66-70` expects (`data.token`, `data.expiresIn`).

- [ ] **Step 1: Write the failing test**

```javascript
// server/tests/extension-refresh.test.js
const { test } = require('node:test');
const assert = require('node:assert');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-extension-refresh';

const jwt = require('jsonwebtoken');
const { extensionRefresh } = require('../src/controllers/auth.controller');

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

test('extensionRefresh: issues a type=extension token for req.user', async () => {
  const req = { user: { _id: 'user123' } };
  const res = mockRes();

  await extensionRefresh(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.body.token, 'no token in response');
  assert.strictEqual(res.body.expiresIn, 300);

  const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
  assert.strictEqual(decoded.type, 'extension');
  assert.strictEqual(decoded.userId, 'user123');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/tests/extension-refresh.test.js`
Expected: FAIL — `extensionRefresh` is `undefined`, TypeError on call

- [ ] **Step 3: Write minimal implementation**

Add to `server/src/controllers/auth.controller.js`, right after `refresh` (after line 165):

```javascript
// POST /api/auth/extension-refresh — mints a short-lived, extension-scoped
// token from the caller's already-verified primary access token (via
// `protect`). Keeps the high-value primary JWT off the extension entirely.
async function extensionRefresh(req, res) {
  try {
    const expiresIn = 300; // 5 minutes, matches PLAN.md §3.2
    const token = jwt.sign(
      { userId: req.user._id, type: 'extension' },
      process.env.JWT_SECRET,
      { expiresIn }
    );
    res.json({ token, expiresIn });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
```

Update the exports block (lines 361-365) to include it:

```javascript
module.exports = {
  register, verifyOtp, resendOtp, login, refresh, extensionRefresh,
  googleAuth, getGoogleOAuthUrl, googleCallback, me,
  forgotPassword, resetPassword, updateProfile,
};
```

Add the route in `server/src/routes/auth.routes.js` — import `extensionRefresh` in the destructure at the top, and add after `router.post('/refresh', refresh);`:

```javascript
router.post('/extension-refresh', protect, extensionRefresh);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/tests/extension-refresh.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/auth.controller.js server/src/routes/auth.routes.js server/tests/extension-refresh.test.js
git commit -m "feat: add POST /api/auth/extension-refresh endpoint"
```

---

### Task 4: GET /api/profile/extension/full endpoint

**Files:**
- Create: `server/src/controllers/profile.controller.js`
- Create: `server/src/routes/profile.routes.js`
- Modify: `server/src/app.js` (mount the new router)
- Test: `server/tests/profile-extension.test.js`

**Interfaces:**
- Consumes: `requireExtensionKey`, `extensionAuth` from Task 2 (`req.user` set by `extensionAuth`)
- Produces: `getExtensionProfile(req, res)` — response shape `{ profile: ProfileField }` matching `uniflux-autofill-extension/src/types/index.ts:1-22` exactly: `{ name, email, resumeUrl, skills, phone, location, linkedIn, portfolio, github, title, bio, education, experience, certifications, coverLetter, preferences }`.

- [ ] **Step 1: Write the failing test**

```javascript
// server/tests/profile-extension.test.js
const { test } = require('node:test');
const assert = require('node:assert');

const { getExtensionProfile } = require('../src/controllers/profile.controller');

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

test('getExtensionProfile: maps User doc to extension ProfileField shape', async () => {
  const req = {
    user: {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      profile: {
        resumeUrl: 'https://example.com/resume.pdf',
        skills: ['TypeScript', 'Math'],
        phone: '+1-555-0100',
        location: 'London',
        linkedIn: 'https://linkedin.com/in/ada',
        portfolio: null,
        github: 'https://github.com/ada',
        title: 'Analytical Engine Programmer',
        bio: 'First programmer.',
        coverLetter: 'Dear hiring manager...',
        education: [{ institution: 'N/A', degree: 'N/A', field: 'Math' }],
        experience: [],
        certifications: [],
        preferences: { locations: ['London'], jobTypes: ['Full-time'], salaryMin: 50000 },
      },
    },
  };
  const res = mockRes();

  await getExtensionProfile(req, res);

  assert.strictEqual(res.statusCode, 200);
  const p = res.body.profile;
  assert.strictEqual(p.name, 'Ada Lovelace');
  assert.strictEqual(p.email, 'ada@example.com');
  assert.strictEqual(p.resumeUrl, 'https://example.com/resume.pdf');
  assert.deepStrictEqual(p.skills, ['TypeScript', 'Math']);
  assert.strictEqual(p.phone, '+1-555-0100');
  assert.strictEqual(p.linkedIn, 'https://linkedin.com/in/ada');
  assert.strictEqual(p.portfolio, null);
  assert.strictEqual(p.github, 'https://github.com/ada');
  assert.strictEqual(p.title, 'Analytical Engine Programmer');
  assert.strictEqual(p.bio, 'First programmer.');
  assert.strictEqual(p.coverLetter, 'Dear hiring manager...');
  assert.strictEqual(p.education.length, 1);
  assert.deepStrictEqual(p.preferences, { locations: ['London'], jobTypes: ['Full-time'], salaryMin: 50000 });
});

test('getExtensionProfile: fills defaults when profile subdocument is sparse', async () => {
  const req = { user: { name: 'Bare User', email: 'bare@example.com', profile: {} } };
  const res = mockRes();

  await getExtensionProfile(req, res);

  const p = res.body.profile;
  assert.strictEqual(p.resumeUrl, null);
  assert.deepStrictEqual(p.skills, []);
  assert.deepStrictEqual(p.education, []);
  assert.deepStrictEqual(p.experience, []);
  assert.deepStrictEqual(p.certifications, []);
  assert.deepStrictEqual(p.preferences, { locations: [], jobTypes: [], salaryMin: null });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/tests/profile-extension.test.js`
Expected: FAIL — `Cannot find module '../src/controllers/profile.controller'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// server/src/controllers/profile.controller.js

// GET /api/profile/extension/full — shape must match
// uniflux-autofill-extension/src/types/index.ts ProfileField exactly.
async function getExtensionProfile(req, res) {
  try {
    const u = req.user;
    const p = u.profile || {};

    res.json({
      profile: {
        name: u.name,
        email: u.email,
        resumeUrl: p.resumeUrl ?? null,
        skills: p.skills ?? [],
        phone: p.phone ?? null,
        location: p.location ?? null,
        linkedIn: p.linkedIn ?? null,
        portfolio: p.portfolio ?? null,
        github: p.github ?? null,
        title: p.title ?? null,
        bio: p.bio ?? null,
        education: p.education ?? [],
        experience: p.experience ?? [],
        certifications: p.certifications ?? [],
        coverLetter: p.coverLetter ?? null,
        preferences: {
          locations: p.preferences?.locations ?? [],
          jobTypes: p.preferences?.jobTypes ?? [],
          salaryMin: p.preferences?.salaryMin ?? null,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getExtensionProfile };
```

```javascript
// server/src/routes/profile.routes.js
const router = require('express').Router();
const { requireExtensionKey, extensionAuth } = require('../middleware/extension.middleware');
const { getExtensionProfile } = require('../controllers/profile.controller');

router.get('/extension/full', requireExtensionKey, extensionAuth, getExtensionProfile);

module.exports = router;
```

In `server/src/app.js`, add the import near the other route imports (after line 7):

```javascript
const profileRoutes = require('./routes/profile.routes');
```

And mount it near the other `app.use` route lines (after line 55):

```javascript
app.use('/api/profile', profileRoutes);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/tests/profile-extension.test.js`
Expected: PASS — both tests pass

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/profile.controller.js server/src/routes/profile.routes.js server/src/app.js server/tests/profile-extension.test.js
git commit -m "feat: add GET /api/profile/extension/full endpoint"
```

---

### Task 5: Manual end-to-end verification (no DB mock available — real server + real Mongo)

**Files:** none (verification only, no code changes)

**Interfaces:** none — exercises Tasks 1-4 together against a running server.

- [ ] **Step 1: Start the server locally**

Run: `cd server && npm run dev`
Expected: server listening (check console for the port from `.env`'s `PORT`)

- [ ] **Step 2: Log in to get a primary access token**

```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<a real seeded test account email>","password":"<its password>"}'
```

Expected: JSON with `tokens.access`

- [ ] **Step 3: Exchange it for an extension token**

```bash
curl -s -X POST http://localhost:5000/api/auth/extension-refresh \
  -H "Authorization: Bearer <access token from step 2>"
```

Expected: `{"token":"...","expiresIn":300}`

- [ ] **Step 4: Fetch the extension profile**

```bash
curl -s http://localhost:5000/api/profile/extension/full \
  -H "X-Extension-Auth: <token from step 3>" \
  -H "X-Extension-Key: a855a6868d073e874980bf6a925d1b8454aa034efff5a8efb146cef90f666104"
```

Expected: `{"profile":{"name":...,"email":...,"resumeUrl":null,"skills":[],...}}` — 200, not 404, not 401

- [ ] **Step 5: Confirm the key gate actually rejects**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/profile/extension/full \
  -H "X-Extension-Auth: <token from step 3>" \
  -H "X-Extension-Key: wrong-key"
```

Expected: `401`

- [ ] **Step 6: Load the extension unpacked and confirm the sidebar shows real profile data**

1. `cd D:/Uniflux/uniflux-autofill-extension && npm run build`
2. Chrome → `chrome://extensions` → enable Developer mode → Load unpacked → select `dist/`
3. Log into `http://localhost:3000` (the portal client) with the same test account
4. Visit a LinkedIn or Indeed job application page
5. Confirm the floating sidebar shows the real name/email instead of "Not connected"

Expected: sidebar shows "Connected", real name/email, "Fill All Fields" enabled

- [ ] **Step 7: Commit nothing — this task is verification only.** If step 6 fails, return to Task 4 and debug before considering this plan done.

---

## Self-Review Notes

- **Spec coverage:** PLAN.md §3.1 (User model) → Task 1. §3.2 endpoints `/api/profile/full` and `/api/auth/extension-refresh` → Tasks 3-4 (routed as `/api/profile/extension/full` to match what the already-shipped extension code calls, not the PLAN.md's `/api/profile/full` — the shipped client code is the ground truth since it can't be changed without a new extension release). §3.2's `/api/field-mappings` endpoints and §3.3's `Extension-Key middleware` → the key middleware is built (Task 2); field-mappings endpoints are out of scope for this plan (no shipped extension code calls them yet — see audit finding on missing learn-mode UI, separate plan).
- **Placeholder scan:** none found — every step has real code.
- **Type consistency:** `ProfileField` shape in Task 4's controller matches `uniflux-autofill-extension/src/types/index.ts:1-22` field-for-field. `extensionRefresh`'s `{ token, expiresIn }` matches what `background/auth.ts:66-70` destructures (`data.token`, `data.expiresIn`).
