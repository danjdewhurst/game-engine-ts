import { test, expect } from 'bun:test';
import { createCollider, CollisionLayers, canLayersCollide } from './Collider';

test('createCollider creates default collider', () => {
  const collider = createCollider();

  expect(collider.type).toBe('Collider');
  expect(collider.boundingBox.x).toBe(0);
  expect(collider.boundingBox.y).toBe(0);
  expect(collider.boundingBox.width).toBe(20);
  expect(collider.boundingBox.height).toBe(20);
  expect(collider.layer).toBe(0);
  expect(collider.isTrigger).toBe(false);
  expect(collider.isStatic).toBe(false);
  expect(collider.mass).toBe(1.0);
  expect(collider.restitution).toBe(0.5);
  expect(collider.friction).toBe(0.1);
});

test('createCollider creates collider with custom values', () => {
  const collider = createCollider(50, 30, CollisionLayers.PLAYER, {
    isTrigger: true,
    isStatic: true,
    mass: 2.5,
    restitution: 0.8,
    friction: 0.3,
  });

  expect(collider.boundingBox.width).toBe(50);
  expect(collider.boundingBox.height).toBe(30);
  expect(collider.layer).toBe(CollisionLayers.PLAYER);
  expect(collider.isTrigger).toBe(true);
  expect(collider.isStatic).toBe(true);
  expect(collider.mass).toBe(2.5);
  expect(collider.restitution).toBe(0.8);
  expect(collider.friction).toBe(0.3);
});

test('collider properties can be modified', () => {
  const collider = createCollider();

  collider.boundingBox.width = 100;
  collider.boundingBox.height = 75;
  collider.layer = CollisionLayers.ENEMY;
  collider.isTrigger = true;
  collider.mass = 3.0;

  expect(collider.boundingBox.width).toBe(100);
  expect(collider.boundingBox.height).toBe(75);
  expect(collider.layer).toBe(CollisionLayers.ENEMY);
  expect(collider.isTrigger).toBe(true);
  expect(collider.mass).toBe(3.0);
});

test('collision layers are properly defined', () => {
  expect(CollisionLayers.DEFAULT).toBe(0);
  expect(CollisionLayers.PLAYER).toBe(1);
  expect(CollisionLayers.ENEMY).toBe(2);
  expect(CollisionLayers.PROJECTILE).toBe(3);
  expect(CollisionLayers.WALL).toBe(4);
  expect(CollisionLayers.PICKUP).toBe(5);
  expect(CollisionLayers.TRIGGER).toBe(6);
});

test('canLayersCollide works correctly', () => {
  // Player can collide with enemy
  expect(canLayersCollide(CollisionLayers.PLAYER, CollisionLayers.ENEMY)).toBe(
    true
  );

  // Enemy can collide with player (symmetric)
  expect(canLayersCollide(CollisionLayers.ENEMY, CollisionLayers.PLAYER)).toBe(
    true
  );

  // Projectile can collide with enemy
  expect(
    canLayersCollide(CollisionLayers.PROJECTILE, CollisionLayers.ENEMY)
  ).toBe(true);

  // Projectile cannot collide with player
  expect(
    canLayersCollide(CollisionLayers.PROJECTILE, CollisionLayers.PLAYER)
  ).toBe(false);

  // Player can collide with pickup
  expect(canLayersCollide(CollisionLayers.PLAYER, CollisionLayers.PICKUP)).toBe(
    true
  );

  // Enemy cannot collide with pickup
  expect(canLayersCollide(CollisionLayers.ENEMY, CollisionLayers.PICKUP)).toBe(
    false
  );

  // Player can collide with trigger
  expect(
    canLayersCollide(CollisionLayers.PLAYER, CollisionLayers.TRIGGER)
  ).toBe(true);

  // Enemy cannot collide with trigger
  expect(canLayersCollide(CollisionLayers.ENEMY, CollisionLayers.TRIGGER)).toBe(
    false
  );
});
