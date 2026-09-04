import assert from 'node:assert/strict';
import test from 'node:test';
import {
  eventIsoDate,
  filterEvents,
  filterEventsByDate,
  findOrientationEventById,
  orientationEvents,
  savedSummary,
} from '../lib/events.ts';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

test('filters orientation events by category', () => {
  const results = filterEvents(orientationEvents, '', 'traditions');
  assert.equal(results.length, 2);
  assert.ok(results.every((event) => event.category === 'traditions'));
});

test('search is case-insensitive and includes locations', () => {
  const results = filterEvents(orientationEvents, 'OLD MAIN', 'all');
  assert.deepEqual(results.map((event) => event.id), ['true-aggie', 'luminary']);
});

test('search matches event start times', () => {
  assert.deepEqual(filterEvents(orientationEvents, '9:00 AM', 'all').map((event) => event.id), ['aggie-welcome']);
  assert.deepEqual(filterEvents(orientationEvents, '8:30 pm', 'all').map((event) => event.id), ['luminary']);
});

test('search and category filters compose', () => {
  const results = filterEvents(orientationEvents, 'quad', 'food');
  assert.deepEqual(results.map((event) => event.id), ['lunch-quad']);
});

test('date selector filters the schedule and can return to the full week', () => {
  assert.deepEqual(filterEventsByDate(orientationEvents, '29').map((event) => event.id), ['luminary']);
  assert.equal(filterEventsByDate(orientationEvents, 'all').length, orientationEvents.length);
});

test('looks events up by id', () => {
  assert.equal(findOrientationEventById('club-rush')?.title, 'Find Your People: Club Rush');
  assert.equal(findOrientationEventById('nope'), undefined);
});

test('every event day label matches the date it resolves to', () => {
  for (const event of orientationEvents) {
    const derived = WEEKDAYS[new Date(`${eventIsoDate(event)}T12:00:00Z`).getUTCDay()];
    assert.equal(derived, event.day, `${event.id} is labelled ${event.day} but resolves to ${derived}`);
  }
});

test('event ids are unique', () => {
  const ids = orientationEvents.map((event) => event.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('saved summary uses the correct singular and empty states', () => {
  assert.equal(savedSummary(0), 'No saved vibes yet');
  assert.equal(savedSummary(1), '1 saved experience');
  assert.equal(savedSummary(3), '3 saved experiences');
});
