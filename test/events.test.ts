import assert from 'node:assert/strict';
import test from 'node:test';
import { filterEvents, filterEventsByDate, orientationEvents, savedSummary } from '../lib/events.ts';

test('filters orientation events by category', () => {
  const results = filterEvents(orientationEvents, '', 'traditions');
  assert.equal(results.length, 2);
  assert.ok(results.every((event) => event.category === 'traditions'));
});

test('search is case-insensitive and includes locations', () => {
  const results = filterEvents(orientationEvents, 'OLD MAIN', 'all');
  assert.deepEqual(results.map((event) => event.id), ['true-aggie', 'luminary']);
});

test('search and category filters compose', () => {
  const results = filterEvents(orientationEvents, 'quad', 'food');
  assert.deepEqual(results.map((event) => event.id), ['lunch-quad']);
});

test('date selector filters the schedule and can return to the full week', () => {
  assert.deepEqual(filterEventsByDate(orientationEvents, '29').map((event) => event.id), ['luminary']);
  assert.equal(filterEventsByDate(orientationEvents, 'all').length, orientationEvents.length);
});

test('saved summary uses the correct singular and empty states', () => {
  assert.equal(savedSummary(0), 'No saved vibes yet');
  assert.equal(savedSummary(1), '1 saved experience');
  assert.equal(savedSummary(3), '3 saved experiences');
});
