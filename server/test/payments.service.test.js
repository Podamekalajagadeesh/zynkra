const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');

const { PaymentsService } = require('../src/payments/payments.service');

test('processPayment persists a transaction record and returns a success payload', async () => {
  const transactions = [];
  const payouts = [];
  const walletService = {
    credit: async () => ({ walletBalance: 25 }),
    debit: async () => ({ walletBalance: 0 }),
  };

  const paymentRepository = {
    create: (data) => data,
    save: async (entity) => {
      transactions.push(entity);
      return entity;
    },
  };

  const payoutRepository = {
    create: (data) => data,
    save: async (entity) => {
      payouts.push(entity);
      return entity;
    },
  };

  const service = new PaymentsService(paymentRepository, payoutRepository, walletService);
  const result = await service.processPayment('user-1', 25, 'subscription', { currency: 'usd' });

  assert.equal(result.success, true);
  assert.equal(result.status, 'succeeded');
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].purpose, 'subscription');
  assert.equal(transactions[0].amount, 25);
  assert.equal(payouts.length, 0);
});
