import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createMessage,
  getClientChannel,
  normalizeConversation,
  normalizeSender,
  parseMessage,
  summarizeConversations,
  validateMessageBody,
} from '../lib/chat-contract.ts';

const conversation = { id: 'student-1234', label: 'Student 1234' };

test('normalizes ordinary chat messages', () => {
  assert.deepEqual(validateMessageBody('  Where is the Quad?  '), {
    ok: true,
    body: 'Where is the Quad?',
  });
});

test('rejects empty and excessively long messages', () => {
  assert.equal(validateMessageBody('   ').ok, false);
  assert.equal(validateMessageBody('x'.repeat(801)).ok, false);
  assert.equal(validateMessageBody(42).ok, false);
});

test('only recognizes the two prototype sender roles', () => {
  assert.equal(normalizeSender('mentor'), 'mentor');
  assert.equal(normalizeSender('admin'), null);
});

test('creates and parses the live transport envelope', () => {
  const now = new Date('2026-08-27T20:00:00.000Z');
  const message = createMessage('  Meet me by the Quad  ', 'student', conversation, now, 'fixed-id');
  assert.ok(message);
  assert.equal(message.id, 'fixed-id');
  assert.equal(message.conversationId, conversation.id);
  assert.equal(message.clientLabel, conversation.label);
  assert.equal(message.body, 'Meet me by the Quad');
  assert.equal(message.createdAt, now.toISOString());
  assert.deepEqual(parseMessage(JSON.stringify(message)), message);
});

test('generates a distinct id per message by default', () => {
  const a = createMessage('hello', 'student', conversation);
  const b = createMessage('hello', 'student', conversation);
  assert.ok(a && b);
  assert.notEqual(a.id, b.id);
});

test('normalizes private conversation identities and channel names', () => {
  assert.deepEqual(normalizeConversation(conversation), conversation);
  assert.equal(normalizeConversation({ id: 'bad id', label: 'Student' }), null);
  assert.equal(normalizeConversation({ id: 'student-1234', label: '' }), null);
  assert.match(getClientChannel(conversation.id), /student-1234$/);
});

test('rejects malformed messages arriving from the network', () => {
  assert.equal(parseMessage('{ definitely not json'), null);
  assert.equal(parseMessage('null'), null);
  assert.equal(parseMessage('"a string"'), null);
  assert.equal(parseMessage(JSON.stringify({ id: 'x', sender: 'admin', body: 'hello', createdAt: 'today' })), null);
  assert.equal(parseMessage(JSON.stringify({ id: 1, conversationId: conversation.id, clientLabel: conversation.label, sender: 'student', body: 'hi', createdAt: new Date().toISOString() })), null);
  assert.equal(parseMessage(JSON.stringify({ id: 'x', conversationId: conversation.id, clientLabel: conversation.label, sender: 'student', body: 'hi', createdAt: 'not-a-date' })), null);
});

test('groups mentor inbox messages into newest-first client conversations', () => {
  const first = createMessage('First question', 'student', conversation, new Date('2026-08-27T20:00:00.000Z'), 'first');
  const secondConversation = { id: 'student-5678', label: 'Student 5678' };
  const second = createMessage('Second question', 'student', secondConversation, new Date('2026-08-27T21:00:00.000Z'), 'second');
  const reply = createMessage('Here is your answer', 'mentor', conversation, new Date('2026-08-27T22:00:00.000Z'), 'reply');
  assert.ok(first && second && reply);

  const summaries = summarizeConversations([first, second, reply]);
  assert.equal(summaries.length, 2);
  assert.equal(summaries[0].id, conversation.id);
  assert.equal(summaries[0].messageCount, 2);
  assert.equal(summaries[0].lastMessage, 'Here is your answer');
  assert.equal(summaries[1].id, secondConversation.id);
});
