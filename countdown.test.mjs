import test from 'node:test';
import assert from 'node:assert/strict';
import { countdownConfig, getRemaining, formatRemaining } from './countdown.js';

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
