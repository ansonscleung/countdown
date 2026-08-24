import test from 'node:test';
import assert from 'node:assert/strict';
import { countdownConfig, getRemaining, formatRemaining, formatTargetLabel } from './countdown.js';

test('uses the configured Hong Kong target timestamp', () => {
  assert.equal(countdownConfig.target, '2026-08-28T18:00:00+08:00');
  assert.equal(new Date(countdownConfig.target).toISOString(), '2026-08-28T10:00:00.000Z');
});

test('formats a multi-day duration as DD : HH : MM : SS', () => {
  const remaining = getRemaining(new Date('2026-08-25T09:30:05+08:00'), countdownConfig.target);
  assert.deepEqual(remaining, { totalSeconds: 289795, days: 3, hours: 8, minutes: 29, seconds: 55, complete: false });
  assert.equal(formatRemaining(remaining), '03 : 08 : 29 : 55');
});

test('clamps a passed target to zero and marks it complete', () => {
  const remaining = getRemaining(new Date('2026-08-28T18:00:01+08:00'), countdownConfig.target);
  assert.deepEqual(remaining, { totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, complete: true });
  assert.equal(formatRemaining(remaining), '00 : 00 : 00 : 00');
});

test('formats the default target label with the HKT label', () => {
  assert.equal(formatTargetLabel(), 'Until 28 August 2026 · 18:00 HKT');
  assert.equal(formatTargetLabel(countdownConfig.target), 'Until 28 August 2026 · 18:00 HKT');
});

test('derives a UTC label for custom targets with an explicit offset', () => {
  assert.equal(formatTargetLabel('2027-01-01T00:00:00+08:00'), 'Until 1 January 2027 · 00:00 UTC+08:00');
  assert.equal(formatTargetLabel('2027-03-14T09:30:00-05:00'), 'Until 14 March 2027 · 09:30 UTC-05:00');
  assert.equal(formatTargetLabel('2027-12-25T22:00Z'), 'Until 25 December 2027 · 22:00 UTC+00:00');
});

test('falls back to the configured label for targets without an offset', () => {
  assert.equal(formatTargetLabel('2027-03-14'), 'Until 14 March 2027 · 00:00 HKT');
  assert.equal(formatTargetLabel('not-a-date'), '');
});
