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
