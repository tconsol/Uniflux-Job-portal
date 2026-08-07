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
  // The wrong-type check in extensionAuth rejects and returns before reaching the Mongo lookup, so no DB connection is needed here.
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
