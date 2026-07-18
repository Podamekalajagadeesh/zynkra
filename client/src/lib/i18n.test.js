import test from 'node:test';
import assert from 'node:assert/strict';
import { getLanguageMetadata, translateTextKey } from './i18n.ts';

test('detects RTL languages', () => {
  assert.equal(getLanguageMetadata('ar').rtl, true);
  assert.equal(getLanguageMetadata('en').rtl, false);
});

test('provides localized strings for supported languages', () => {
  assert.equal(translateTextKey('settings.region', 'es'), 'Región');
  assert.equal(translateTextKey('settings.autoTranslate', 'fr'), 'Traduction automatique');
});
