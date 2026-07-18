#!/usr/bin/env node
const axios = require('axios');

async function main() {
  const target = process.argv[2] || 'mastodon.social';
  const normalized = target.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const baseUrl = `https://${normalized}`;

  try {
    const nodeInfoResponse = await axios.get(`${baseUrl}/.well-known/nodeinfo`, { timeout: 5000 });
    const nodeInfoLinks = nodeInfoResponse.data?.links || [];
    const nodeInfoUrl = nodeInfoLinks.find((link) => link.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.0')?.href || `${baseUrl}/nodeinfo/2.0`;
    const nodeInfo = await axios.get(nodeInfoUrl, { timeout: 5000 });
    const webfingerResponse = await axios.get(`${baseUrl}/.well-known/webfinger?resource=acct:local@${normalized}`, { timeout: 5000 });

    console.log(JSON.stringify({
      domain: normalized,
      compatible: true,
      software: nodeInfo.data?.software?.name || null,
      version: nodeInfo.data?.software?.version || null,
      capabilities: ['inbox', 'outbox', 'nodeinfo', 'webfinger'],
      webfinger: webfingerResponse.data || null,
      testedAt: new Date().toISOString(),
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      domain: normalized,
      compatible: false,
      error: error.message,
      testedAt: new Date().toISOString(),
    }, null, 2));
    process.exitCode = 1;
  }
}

main();
