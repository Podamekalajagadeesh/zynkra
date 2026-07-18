const test = require('node:test');
const assert = require('node:assert/strict');
const { AdvancedFeaturesService } = require('./advanced-features.service');

test('returns enabled advanced feature status', () => {
  const service = new AdvancedFeaturesService();
  const status = service.getStatus();

  assert.equal(status.spaceSatellite.supported, true);
  assert.equal(status.meshSync.enabled, true);
  assert.equal(status.realTimeTranslation.enabled, true);
});

test('translates common phrases into the requested language', () => {
  const service = new AdvancedFeaturesService();
  const result = service.translateText('Hello world', 'es');

  assert.equal(result.translatedText.includes('Hola'), true);
  assert.equal(result.detectedSourceLanguage, 'en');
  assert.equal(result.sourceType, 'human');
});
