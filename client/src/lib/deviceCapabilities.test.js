import test from 'node:test';
import assert from 'node:assert/strict';
import { detectDeviceCapabilities } from './deviceCapabilities.ts';

test('detects desktop mode by default', () => {
  const result = detectDeviceCapabilities();
  assert.equal(result.mode, 'desktop');
  assert.equal(result.label, 'Desktop');
});

test('detects smart tv and smartwatch modes', () => {
  const tv = detectDeviceCapabilities({ userAgent: 'Mozilla/5.0 GoogleTV', width: 1920, height: 1080 });
  const watch = detectDeviceCapabilities({ userAgent: 'Wear OS', width: 200, height: 200 });

  assert.equal(tv.mode, 'tv');
  assert.equal(tv.label, 'Smart TV');
  assert.equal(watch.mode, 'watch');
  assert.equal(watch.label, 'Smartwatch');
});
