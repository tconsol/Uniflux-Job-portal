// server/tests/profile-update.test.js
const { test } = require('node:test');
const assert = require('node:assert');

const { updateProfile } = require('../src/controllers/profile.controller');

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

function mockUser(overrides = {}) {
  return {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    profile: {
      resumeUrl: null,
      skills: [],
      phone: null,
      location: null,
      linkedIn: null,
      portfolio: null,
      github: null,
      title: null,
      bio: null,
      coverLetter: null,
      education: [],
      experience: [],
      certifications: [],
      preferences: { locations: [], jobTypes: [], salaryMin: null },
    },
    saved: false,
    save() { this.saved = true; return Promise.resolve(this); },
    ...overrides,
  };
}

test('updateProfile: writes scalar and array fields, leaves omitted fields untouched', async () => {
  const user = mockUser();
  const req = {
    user,
    body: {
      phone: '+1-555-0100',
      title: 'Analytical Engine Programmer',
      skills: ['TypeScript', 'Math'],
      education: [{ institution: 'N/A', degree: 'N/A', field: 'Math' }],
      preferences: { salaryMin: 50000 },
    },
  };
  const res = mockRes();

  await updateProfile(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(user.saved, true);
  assert.strictEqual(user.profile.phone, '+1-555-0100');
  assert.strictEqual(user.profile.title, 'Analytical Engine Programmer');
  assert.deepStrictEqual(user.profile.skills, ['TypeScript', 'Math']);
  assert.strictEqual(user.profile.education.length, 1);
  assert.strictEqual(user.profile.preferences.salaryMin, 50000);
  // untouched fields stay at defaults
  assert.strictEqual(user.profile.location, null);
  assert.deepStrictEqual(user.profile.preferences.locations, []);

  assert.strictEqual(res.body.profile.phone, '+1-555-0100');
  assert.strictEqual(res.body.profile.name, 'Ada Lovelace');
});

test('updateProfile: null clears a nullable scalar field', async () => {
  const user = mockUser();
  user.profile.bio = 'Old bio';

  await updateProfile({ user, body: { bio: null } }, mockRes());

  assert.strictEqual(user.profile.bio, null);
});

test('updateProfile: rejects wrong type for scalar field', async () => {
  const user = mockUser();
  const res = mockRes();

  await updateProfile({ user, body: { phone: 12345 } }, res);

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(user.saved, false);
});

test('updateProfile: rejects non-string-array skills', async () => {
  const user = mockUser();
  const res = mockRes();

  await updateProfile({ user, body: { skills: ['ok', 5] } }, res);

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(user.saved, false);
});

test('updateProfile: rejects non-array education', async () => {
  const user = mockUser();
  const res = mockRes();

  await updateProfile({ user, body: { education: 'nope' } }, res);

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(user.saved, false);
});

test('updateProfile: rejects wrong type inside preferences', async () => {
  const user = mockUser();
  const res = mockRes();

  await updateProfile({ user, body: { preferences: { salaryMin: 'lots' } } }, res);

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(user.saved, false);
});

test('updateProfile: empty body is a no-op save', async () => {
  const user = mockUser();
  const res = mockRes();

  await updateProfile({ user, body: {} }, res);

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(user.saved, true);
});
