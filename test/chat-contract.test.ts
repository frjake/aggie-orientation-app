import assert from 'node:assert/strict';
import test from 'node:test';
import {
  manufactureLiveMessage,
  normalizeAndValidateMessage,
  normalizeSender,
  parseLiveMessage,
} from '../lib/chat-contract.ts';

test('normalizes ordinary chat messages', () => {
  assert.deepEqual(normalizeAndValidateMessage('  Where is the Quad?  '), {
    ok: true,
    body: 'Where is the Quad?',
  });
});

test('rejects empty and excessively long messages', () => {
  assert.equal(normalizeAndValidateMessage('   ').ok, false);
  assert.equal(normalizeAndValidateMessage('x'.repeat(801)).ok, false);
});

test('only recognizes the two prototype sender roles', () => {
  assert.equal(normalizeSender('mentor'), 'mentor');
  assert.equal(normalizeSender('admin'), null);
});

test('creates and parses the live transport envelope', () => {
  const now = new Date('2026-08-27T20:00:00.000Z');
  const message = manufactureLiveMessage('  Meet me by the Quad  ', 'student', now);
  assert.ok(message);
  assert.equal(message.body, 'Meet me by the Quad');
  assert.equal(message.createdAt, now.toISOString());
  assert.deepEqual(parseLiveMessage(JSON.stringify(message)), message);
});

test('rejects malformed messages arriving from the public room', () => {
  assert.equal(parseLiveMessage('{ definitely not json'), null);
  assert.equal(parseLiveMessage(JSON.stringify({ id: 1, sender: 'admin', body: 'hello', createdAt: 'today' })), null);
});
