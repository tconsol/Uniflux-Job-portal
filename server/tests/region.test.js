// Dependency-free tests (node --test) for the region-decision logic.
const { test } = require('node:test');
const assert = require('node:assert');

const { regionForIp } = require('../src/services/geo.service');
const { countryForRequest } = require('../src/controllers/jobs.controller');

test('regionForIp: an Indian IP → IN', () => {
  // 49.36.0.0/14 is an Indian range (Reliance Jio) in the geoip-lite DB.
  assert.strictEqual(regionForIp('49.36.0.1'), 'IN');
});

test('regionForIp: a US IP → US', () => {
  assert.strictEqual(regionForIp('8.8.8.8'), 'US'); // Google US
});

test('regionForIp: unknown/localhost → US default', () => {
  assert.strictEqual(regionForIp('127.0.0.1'), 'US');
  assert.strictEqual(regionForIp(''), 'US');
});

test('countryForRequest: logged-in user region wins (US→us, IN→in)', () => {
  assert.strictEqual(countryForRequest({ user: { region: 'IN' }, query: {} }), 'in');
  assert.strictEqual(countryForRequest({ user: { region: 'US' }, query: {} }), 'us');
});

test('countryForRequest: no user → ?country= override when valid', () => {
  assert.strictEqual(countryForRequest({ query: { country: 'in' } }), 'in');
  assert.strictEqual(countryForRequest({ query: { country: 'US' } }), 'us'); // case-insensitive
});

test('countryForRequest: no user, no valid override → geoip on request IP', () => {
  assert.strictEqual(countryForRequest({ query: { country: 'xx' }, ip: '49.36.0.1' }), 'in');
  assert.strictEqual(countryForRequest({ query: {}, ip: '8.8.8.8' }), 'us');
});

test('countryForRequest: user region takes precedence over ?country', () => {
  assert.strictEqual(countryForRequest({ user: { region: 'US' }, query: { country: 'in' } }), 'us');
});
