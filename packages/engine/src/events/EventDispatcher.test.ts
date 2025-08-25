import { test, expect } from 'bun:test';
import { EventDispatcher } from './EventDispatcher';
import type { EntityCreatedEvent, CustomEvent } from './EventDispatcher';

test('EventDispatcher emits and receives events', () => {
  const dispatcher = new EventDispatcher();
  let receivedEvent: any = null;

  const subscription = dispatcher.on('entity:created', (event) => {
    receivedEvent = event;
  });

  const event: EntityCreatedEvent = {
    type: 'entity:created',
    entityId: 123,
    timestamp: Date.now(),
  };

  dispatcher.emit(event);

  expect(receivedEvent).not.toBeNull();
  expect(receivedEvent.type).toBe('entity:created');
  expect(receivedEvent.entityId).toBe(123);

  subscription.unsubscribe();
});

test('EventDispatcher handles one-time listeners', () => {
  const dispatcher = new EventDispatcher();
  let callCount = 0;

  dispatcher.once('entity:created', () => {
    callCount++;
  });

  const event: EntityCreatedEvent = {
    type: 'entity:created',
    entityId: 123,
    timestamp: Date.now(),
  };

  dispatcher.emit(event);
  dispatcher.emit(event);

  expect(callCount).toBe(1); // Should only be called once
});

test('EventDispatcher handles global listeners', () => {
  const dispatcher = new EventDispatcher();
  let globalEvents: any[] = [];

  const subscription = dispatcher.onAll((event) => {
    globalEvents.push(event);
  });

  dispatcher.emit({
    type: 'entity:created',
    entityId: 1,
    timestamp: Date.now(),
  });

  dispatcher.emit({
    type: 'entity:destroyed',
    entityId: 2,
    timestamp: Date.now(),
  });

  expect(globalEvents).toHaveLength(2);
  expect(globalEvents[0].type).toBe('entity:created');
  expect(globalEvents[1].type).toBe('entity:destroyed');

  subscription.unsubscribe();
});

test('EventDispatcher tracks event history', () => {
  const dispatcher = new EventDispatcher();

  dispatcher.emit({
    type: 'entity:created',
    entityId: 1,
    timestamp: Date.now(),
  });

  dispatcher.emit({
    type: 'entity:destroyed',
    entityId: 2,
    timestamp: Date.now(),
  });

  const history = dispatcher.getEventHistory();
  expect(history).toHaveLength(2);

  const entityHistory = dispatcher.getEventHistory('entity:created');
  expect(entityHistory).toHaveLength(1);
  expect(entityHistory[0].type).toBe('entity:created');
});

test('EventDispatcher handles custom events', () => {
  const dispatcher = new EventDispatcher();
  let customData: any = null;

  dispatcher.on('custom:test', (event: any) => {
    customData = event.data;
  });

  const customEvent: CustomEvent = {
    type: 'custom:test',
    data: { message: 'Hello World', value: 42 },
    timestamp: Date.now(),
  };

  dispatcher.emit(customEvent);

  expect(customData).not.toBeNull();
  expect(customData.message).toBe('Hello World');
  expect(customData.value).toBe(42);
});

test('EventDispatcher filters events correctly', () => {
  const dispatcher = new EventDispatcher();
  let filteredEvents: any[] = [];

  dispatcher.onFiltered(
    'entity:created',
    (event: any) => event.entityId > 100,
    (event) => {
      filteredEvents.push(event);
    }
  );

  // This should be filtered out
  dispatcher.emit({
    type: 'entity:created',
    entityId: 50,
    timestamp: Date.now(),
  });

  // This should pass the filter
  dispatcher.emit({
    type: 'entity:created',
    entityId: 150,
    timestamp: Date.now(),
  });

  expect(filteredEvents).toHaveLength(1);
  expect(filteredEvents[0].entityId).toBe(150);
});

test('EventDispatcher handles batch events', () => {
  const dispatcher = new EventDispatcher();
  let eventCount = 0;

  dispatcher.on('entity:created', () => {
    eventCount++;
  });

  const events = [
    { type: 'entity:created', entityId: 1, timestamp: Date.now() },
    { type: 'entity:created', entityId: 2, timestamp: Date.now() },
    { type: 'entity:created', entityId: 3, timestamp: Date.now() },
  ];

  dispatcher.emitBatch(events);

  expect(eventCount).toBe(3);
});

test('EventDispatcher provides correct statistics', () => {
  const dispatcher = new EventDispatcher();

  dispatcher.on('entity:created', () => {});
  dispatcher.on('entity:destroyed', () => {});
  dispatcher.once('system:added', () => {});
  dispatcher.onAll(() => {});

  const stats = dispatcher.getStats();

  expect(stats.totalEventTypes).toBe(3);
  expect(stats.totalListeners).toBe(3);
  expect(stats.globalListeners).toBe(1);
  expect(stats.listenersByType['entity:created']).toBe(1);
});

test('EventDispatcher handles listener removal correctly', () => {
  const dispatcher = new EventDispatcher();
  let callCount = 0;

  const subscription = dispatcher.on('entity:created', () => {
    callCount++;
  });

  dispatcher.emit({
    type: 'entity:created',
    entityId: 1,
    timestamp: Date.now(),
  });

  expect(callCount).toBe(1);

  subscription.unsubscribe();

  dispatcher.emit({
    type: 'entity:created',
    entityId: 2,
    timestamp: Date.now(),
  });

  expect(callCount).toBe(1); // Should not increase after unsubscribe
});

test('EventDispatcher handles errors in listeners gracefully', () => {
  const dispatcher = new EventDispatcher();
  let successfulCall = false;

  // This listener will throw an error
  dispatcher.on('entity:created', () => {
    throw new Error('Test error');
  });

  // This listener should still be called despite the error above
  dispatcher.on('entity:created', () => {
    successfulCall = true;
  });

  // Should not throw, but should log error to console
  dispatcher.emit({
    type: 'entity:created',
    entityId: 1,
    timestamp: Date.now(),
  });

  expect(successfulCall).toBe(true);
});

test('EventDispatcher clears listeners correctly', () => {
  const dispatcher = new EventDispatcher();

  dispatcher.on('entity:created', () => {});
  dispatcher.onAll(() => {});

  expect(dispatcher.getStats().totalListeners).toBeGreaterThan(0);
  expect(dispatcher.getStats().globalListeners).toBe(1);

  dispatcher.clear();

  expect(dispatcher.getStats().totalListeners).toBe(0);
  expect(dispatcher.getStats().globalListeners).toBe(0);
});
