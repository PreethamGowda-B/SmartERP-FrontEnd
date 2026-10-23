'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeNotificationsById, notificationIdentity } = require('../lib/notification-dedupe');

test('initial API load and matching live event produce one notification by stable ID', () => {
  const api = [{ id: 12, title: 'Site Proof Uploaded', created_at: '2026-10-23T01:00:00Z' }];
  const live = [{ id: '12', title: 'Site Proof Uploaded', created_at: '2026-10-23T01:00:00Z' }];
  assert.equal(mergeNotificationsById(live, api).length, 1);
  assert.equal(notificationIdentity(api[0]), '12');
});

test('distinct events with identical text remain separate notifications', () => {
  const sameText = [
    { id: 12, title: 'Site Proof Uploaded', message: 'Uploaded proof', created_at: '2026-10-23T01:00:00Z' },
    { id: 13, title: 'Site Proof Uploaded', message: 'Uploaded proof', created_at: '2026-10-23T00:59:00Z' },
  ];
  assert.equal(mergeNotificationsById(sameText).length, 2);
});

test('repeated list snapshots do not create duplicate cards and newest server value wins', () => {
  const previous = [{ id: 'a', title: 'Old title', created_at: '2026-10-23T01:00:00Z' }];
  const current = [{ id: 'a', title: 'Updated title', created_at: '2026-10-23T01:00:00Z' }];
  const merged = mergeNotificationsById(current, previous);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].title, 'Updated title');
});
