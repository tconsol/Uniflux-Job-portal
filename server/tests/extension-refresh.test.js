// server/tests/extension-refresh.test.js
const { test } = require('node:test');
const assert = require('node:assert');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-extension-refresh';
process.env.RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID     || 'test-razorpay-key-id';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test-razorpay-key-secret';

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
