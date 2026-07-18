const test = require('node:test');
const assert = require('node:assert/strict');
const { PaymentsService } = require('../dist/payments/payments.service');

test('processPayment and sendPayout complete successfully for monetization flows', async () => {
  const paymentsService = new PaymentsService();

  const payment = await paymentsService.processPayment('user-1', 12.5, 'creator_tip');
  assert.equal(payment.status, 'succeeded');
  assert.equal(payment.amount, 12.5);
  assert.equal(payment.userId, 'user-1');

  const payout = await paymentsService.sendPayout('creator-1', 11.25, 'creator_tip');
  assert.equal(payout.status, 'succeeded');
  assert.equal(payout.amount, 11.25);
  assert.equal(payout.creatorId, 'creator-1');
});
