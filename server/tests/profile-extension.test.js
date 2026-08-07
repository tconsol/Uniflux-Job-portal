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
  assert.deepStrictEqual(p, {
    name: 'Bare User',
    email: 'bare@example.com',
    resumeUrl: null,
    skills: [],
    phone: null,
    location: null,
    linkedIn: null,
    portfolio: null,
    github: null,
    title: null,
    bio: null,
    education: [],
    experience: [],
    certifications: [],
    coverLetter: null,
    preferences: { locations: [], jobTypes: [], salaryMin: null },
  });
});
