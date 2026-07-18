const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');

const { NotificationsService } = require('./notifications.service');
const { NotificationType } = require('./entities/notification.entity');

test('create sends an email for follow notifications when email delivery is enabled', async () => {
  const notificationRepository = {
    create: (payload) => payload,
    save: async (payload) => ({ ...payload, id: 'notif-1' }),
  };
  const pushSubscriptionRepository = { find: async () => [] };
  const mobilePushTokenRepository = { find: async () => [] };
  const notificationsGateway = { sendNotificationToUser: () => {} };
  const configService = { get: () => undefined };
  const emailService = { sendNotificationEmail: async () => {} };

  const service = new NotificationsService(
    notificationRepository,
    pushSubscriptionRepository,
    mobilePushTokenRepository,
    notificationsGateway,
    configService,
    emailService,
  );

  let sentEmail = null;
  emailService.sendNotificationEmail = async (recipient, subject, html) => {
    sentEmail = { recipient, subject, html };
  };

  const user = {
    id: 'user-1',
    email: 'user@example.com',
    notificationSettings: {
      emailNotifications: true,
      likes: true,
      comments: true,
      newFollowers: true,
    },
  };

  await service.create(user, NotificationType.FOLLOW, { message: 'Alice followed you' });

  assert.ok(sentEmail);
  assert.equal(sentEmail.recipient, 'user@example.com');
  assert.match(sentEmail.subject, /follow/i);
});

test('create skips delivery when the user disables that notification type', async () => {
  const notificationRepository = {
    create: (payload) => payload,
    save: async (payload) => ({ ...payload, id: 'notif-2' }),
  };
  const pushSubscriptionRepository = { find: async () => [] };
  const mobilePushTokenRepository = { find: async () => [] };
  const notificationsGateway = { sendNotificationToUser: () => {} };
  const configService = { get: () => undefined };
  const emailService = { sendNotificationEmail: async () => {} };

  const service = new NotificationsService(
    notificationRepository,
    pushSubscriptionRepository,
    mobilePushTokenRepository,
    notificationsGateway,
    configService,
    emailService,
  );

  let sentEmail = false;
  emailService.sendNotificationEmail = async () => {
    sentEmail = true;
  };

  const user = {
    id: 'user-2',
    email: 'user2@example.com',
    notificationSettings: {
      emailNotifications: true,
      likes: false,
      comments: true,
      newFollowers: true,
    },
  };

  const result = await service.create(user, NotificationType.LIKE, { message: 'Someone liked your post' });

  assert.equal(result, null);
  assert.equal(sentEmail, false);
});
