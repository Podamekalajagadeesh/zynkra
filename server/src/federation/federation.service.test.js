require('reflect-metadata');
require('ts-node/register/transpile-only');
const Module = require('module');
const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === '../users/users.service') {
    return { UsersService: class UsersService {} };
  }
  if (request === '../posts/posts.service') {
    return { PostsService: class PostsService {} };
  }
  return originalLoad.apply(this, arguments);
};

const { FederationService } = require('./federation.service');

test('processSharedInbox persists incoming Create activities', async () => {
  const createdPosts = [];
  const instanceRepository = {
    findOne: async () => ({ id: 'instance-1', domain: 'example.com', baseUrl: 'https://example.com' }),
    create: (data) => data,
    save: async (data) => ({ ...data, id: 'remote-post-1' }),
  };
  const remoteUserRepository = {
    findOne: async () => null,
    create: (data) => data,
    save: async (data) => ({ ...data, id: 'remote-user-1' }),
  };
  const remotePostRepository = {
    findOne: async () => null,
    create: (data) => {
      createdPosts.push(data);
      return data;
    },
    save: async (data) => ({ ...data, id: 'remote-post-1' }),
  };
  const configService = {
    get: (key, fallback) => fallback ?? null,
  };
  const userService = {
    findOneById: async () => ({ id: 'user-1', username: 'localuser' }),
    findByUsername: async () => ({ id: 'user-1', username: 'localuser' }),
  };
  const postsService = {
    findPostsByUserId: async () => [],
  };

  const service = new FederationService(
    instanceRepository,
    remoteUserRepository,
    remotePostRepository,
    configService,
    userService,
    postsService,
  );

  const result = await service.processSharedInbox({
    type: 'Create',
    actor: 'https://example.com/users/alice',
    object: {
      id: 'https://example.com/posts/1',
      type: 'Note',
      content: 'Hello federation',
      published: '2026-07-04T00:00:00.000Z',
      attributedTo: 'https://example.com/users/alice',
    },
  });

  assert.equal(result.success, true);
  assert.equal(createdPosts.length, 1);
  assert.equal(createdPosts[0].content, 'Hello federation');
  assert.equal(result.persistedPostId, 'remote-post-1');
});

test('processSharedInbox sends an Accept for incoming Follow activities', async () => {
  const deliveries = [];
  const originalPost = axios.post;
  axios.post = async (url, data) => {
    deliveries.push({ url, data });
    return { status: 202 };
  };

  const instanceRepository = {
    findOne: async () => ({ id: 'instance-1', domain: 'example.com', baseUrl: 'https://example.com' }),
    create: (data) => data,
    save: async (data) => ({ ...data, id: 'remote-post-1' }),
  };
  const remoteUserRepository = {
    findOne: async () => null,
    create: (data) => data,
    save: async (data) => ({ ...data, id: 'remote-user-1' }),
  };
  const remotePostRepository = {
    findOne: async () => null,
    create: (data) => data,
    save: async (data) => ({ ...data, id: 'remote-post-1' }),
  };
  const configService = {
    get: (key, fallback) => fallback ?? null,
  };
  const userService = {
    findOneById: async () => ({ id: 'user-1', username: 'localuser' }),
    findByUsername: async () => ({ id: 'user-1', username: 'localuser' }),
  };
  const postsService = {
    findPostsByUserId: async () => [],
  };

  const service = new FederationService(
    instanceRepository,
    remoteUserRepository,
    remotePostRepository,
    configService,
    userService,
    postsService,
  );

  try {
    const result = await service.processSharedInbox({
      type: 'Follow',
      actor: 'https://example.com/users/alice',
      object: 'https://example.com/users/bob',
    });

    assert.equal(result.success, true);
    assert.equal(deliveries.length, 1);
    assert.equal(deliveries[0].data.type, 'Accept');
    assert.equal(deliveries[0].data.object.type, 'Follow');
  } finally {
    axios.post = originalPost;
  }
});

test('fetchRemoteUser stores a remote actor and its instance', async () => {
  const savedUsers = [];
  const savedInstances = [];

  const instanceRepository = {
    findOne: async () => null,
    create: (data) => data,
    save: async (data) => {
      savedInstances.push(data);
      return data;
    },
  };
  const remoteUserRepository = {
    findOne: async () => null,
    create: (data) => data,
    save: async (data) => {
      savedUsers.push(data);
      return data;
    },
  };
  const remotePostRepository = {
    findOne: async () => null,
    create: (data) => data,
    save: async (data) => ({ ...data, id: 'remote-post-1' }),
  };

  const originalGet = axios.get;
  axios.get = async (url) => {
    if (url === 'https://example.com/users/alice') {
      return { data: { preferredUsername: 'alice', name: 'Alice', summary: '', inbox: 'https://example.com/users/alice/inbox', outbox: 'https://example.com/users/alice/outbox', followers: 'https://example.com/users/alice/followers', following: 'https://example.com/users/alice/following' } };
    }
    throw new Error(`Unexpected url ${url}`);
  };

  const service = new FederationService(
    instanceRepository,
    remoteUserRepository,
    remotePostRepository,
    { get: (key, fallback) => fallback ?? null },
    { findOneById: async () => ({ id: 'user-1', username: 'localuser' }), findByUsername: async () => ({ id: 'user-1', username: 'localuser' }) },
    { findPostsByUserId: async () => [] },
  );

  try {
    const user = await service.fetchRemoteUser('https://example.com/users/alice');
    assert.equal(user.username, 'alice');
    assert.equal(savedInstances.length, 1);
    assert.equal(savedInstances[0].domain, 'example.com');
  } finally {
    axios.get = originalGet;
  }
});

test('fetchRemotePost persists a remote note even when the author lookup fails', async () => {
  const createdPosts = [];
  const originalGet = axios.get;
  axios.get = async (url) => {
    if (url === 'https://example.com/posts/42') {
      return { data: { type: 'Create', actor: 'https://example.com/users/alice', object: { id: 'https://example.com/posts/42', content: 'Remote note', published: '2026-07-05T00:00:00.000Z' } } };
    }
    if (url === 'https://example.com/users/alice') {
      throw new Error('actor unavailable');
    }
    throw new Error(`Unexpected url ${url}`);
  };

  const service = new FederationService(
    { findOne: async () => ({ id: 'instance-1', domain: 'example.com', baseUrl: 'https://example.com' }), create: (data) => data, save: async (data) => ({ ...data, id: 'instance-1' }) },
    { findOne: async () => null, create: (data) => data, save: async (data) => ({ ...data, id: 'remote-user-1' }) },
    { findOne: async () => null, create: (data) => { createdPosts.push(data); return data; }, save: async (data) => ({ ...data, id: 'remote-post-1' }) },
    { get: (key, fallback) => fallback ?? null },
    { findOneById: async () => ({ id: 'user-1', username: 'localuser' }), findByUsername: async () => ({ id: 'user-1', username: 'localuser' }) },
    { findPostsByUserId: async () => [] },
  );

  try {
    const post = await service.fetchRemotePost('https://example.com/posts/42');
    assert.equal(post.content, 'Remote note');
    assert.equal(createdPosts.length, 1);
  } finally {
    axios.get = originalGet;
  }
});

test('probeInteroperability returns compatibility details for Mastodon-style instances', async () => {
  const originalGet = axios.get;
  axios.get = async (url) => {
    if (url.includes('/.well-known/nodeinfo')) {
      return { data: { links: [{ rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0', href: 'https://mastodon.example/nodeinfo/2.0' }] } };
    }
    if (url.includes('/nodeinfo/2.0')) {
      return { data: { software: { name: 'mastodon', version: '4.3.0' }, metadata: { nodeName: 'Mastodon' } } };
    }
    if (url.includes('/.well-known/webfinger')) {
      return { data: { links: [{ rel: 'self', type: 'application/activity+json', href: 'https://mastodon.example/users/alice' }] } };
    }
    throw new Error(`Unexpected url ${url}`);
  };

  const service = new FederationService(
    { findOne: async () => null, create: (data) => data, save: async (data) => ({ ...data, id: 'instance-1' }) },
    { findOne: async () => null, create: (data) => data, save: async (data) => ({ ...data, id: 'remote-user-1' }) },
    { findOne: async () => null, create: (data) => data, save: async (data) => ({ ...data, id: 'remote-post-1' }) },
    { get: (key, fallback) => fallback ?? null },
    { findOneById: async () => ({ id: 'user-1', username: 'localuser' }), findByUsername: async () => ({ id: 'user-1', username: 'localuser' }) },
    { findPostsByUserId: async () => [] },
  );

  try {
    const result = await service.probeInteroperability('mastodon.example');
    assert.equal(result.compatible, true);
    assert.ok(result.capabilities.includes('inbox'));
    assert.ok(result.capabilities.includes('outbox'));
    assert.equal(result.software, 'mastodon');
  } finally {
    axios.get = originalGet;
  }
});

test('deliverToInbox retries once after a transient failure', async () => {
  let attempts = 0;
  const originalPost = axios.post;
  axios.post = async () => {
    attempts += 1;
    if (attempts === 1) {
      throw new Error('temporary outage');
    }
    return { status: 202 };
  };

  const service = new FederationService(
    { findOne: async () => null, create: (data) => data, save: async (data) => ({ ...data, id: 'instance-1' }) },
    { findOne: async () => null, create: (data) => data, save: async (data) => ({ ...data, id: 'remote-user-1' }) },
    { findOne: async () => null, create: (data) => data, save: async (data) => ({ ...data, id: 'remote-post-1' }) },
    { get: (key, fallback) => fallback ?? null },
    { findOneById: async () => ({ id: 'user-1', username: 'localuser' }), findByUsername: async () => ({ id: 'user-1', username: 'localuser' }) },
    { findPostsByUserId: async () => [] },
  );

  try {
    await service.deliverToInbox({ baseUrl: 'https://example.com' }, { type: 'Create' });
    assert.equal(attempts, 2);
  } finally {
    axios.post = originalPost;
  }
});
