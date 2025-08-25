import { test, expect } from 'bun:test';
import {
  checkAABBCollision,
  getCollisionInfo,
  updateBoundingBox,
  resolveCollision,
  isPointInBox,
  getBoxCenter,
  getBoxCorners,
} from './collision';
import type { BoundingBox } from '../components/Collider';

test('checkAABBCollision detects overlapping boxes', () => {
  const boxA: BoundingBox = { x: 0, y: 0, width: 20, height: 20 };
  const boxB: BoundingBox = { x: 10, y: 10, width: 20, height: 20 };

  expect(checkAABBCollision(boxA, boxB)).toBe(true);
});

test('checkAABBCollision detects non-overlapping boxes', () => {
  const boxA: BoundingBox = { x: 0, y: 0, width: 20, height: 20 };
  const boxB: BoundingBox = { x: 25, y: 25, width: 20, height: 20 };

  expect(checkAABBCollision(boxA, boxB)).toBe(false);
});

test('checkAABBCollision detects touching boxes', () => {
  const boxA: BoundingBox = { x: 0, y: 0, width: 20, height: 20 };
  const boxB: BoundingBox = { x: 20, y: 0, width: 20, height: 20 };

  expect(checkAABBCollision(boxA, boxB)).toBe(false); // Touching edges don't overlap
});

test('getCollisionInfo returns null for non-colliding boxes', () => {
  const boxA: BoundingBox = { x: 0, y: 0, width: 20, height: 20 };
  const boxB: BoundingBox = { x: 25, y: 25, width: 20, height: 20 };

  const collision = getCollisionInfo(1, 2, boxA, boxB);
  expect(collision).toBeNull();
});

test('getCollisionInfo returns collision data for overlapping boxes', () => {
  const boxA: BoundingBox = { x: 0, y: 0, width: 20, height: 20 };
  const boxB: BoundingBox = { x: 10, y: 5, width: 20, height: 20 };

  const collision = getCollisionInfo(1, 2, boxA, boxB);

  expect(collision).not.toBeNull();
  expect(collision!.entityA).toBe(1);
  expect(collision!.entityB).toBe(2);
  expect(collision!.penetration).toBeGreaterThan(0);
  expect(collision!.normal.x).toBeCloseTo(-1); // A is to the left of B
  expect(collision!.normal.y).toBeCloseTo(0);
});

test('getCollisionInfo calculates correct normal for vertical collision', () => {
  const boxA: BoundingBox = { x: 10, y: 0, width: 20, height: 20 };
  const boxB: BoundingBox = { x: 5, y: 10, width: 20, height: 20 };

  const collision = getCollisionInfo(1, 2, boxA, boxB);

  expect(collision).not.toBeNull();
  expect(collision!.normal.x).toBeCloseTo(0);
  expect(collision!.normal.y).toBeCloseTo(-1); // A is above B
});

test('updateBoundingBox centers box on position', () => {
  const boundingBox: BoundingBox = { x: 0, y: 0, width: 20, height: 20 };
  const position = { x: 50, y: 30 };

  updateBoundingBox(boundingBox, position);

  expect(boundingBox.x).toBe(40); // 50 - 20/2
  expect(boundingBox.y).toBe(20); // 30 - 20/2
});

test('updateBoundingBox updates size when provided', () => {
  const boundingBox: BoundingBox = { x: 0, y: 0, width: 20, height: 20 };
  const position = { x: 0, y: 0 };
  const size = { x: 40, y: 30 };

  updateBoundingBox(boundingBox, position, size);

  expect(boundingBox.width).toBe(40);
  expect(boundingBox.height).toBe(30);
  expect(boundingBox.x).toBe(-20); // 0 - 40/2
  expect(boundingBox.y).toBe(-15); // 0 - 30/2
});

test('resolveCollision handles basic collision', () => {
  const collision = {
    entityA: 1,
    entityB: 2,
    normal: { x: -1, y: 0 }, // A is to the left of B
    penetration: 5,
    contactPoint: { x: 15, y: 10 },
    timestamp: Date.now(),
  };

  const velocityA = { x: 10, y: 0 };
  const velocityB = { x: -5, y: 0 };

  const resolution = resolveCollision(
    collision,
    1.0,
    1.0, // masses
    0.5,
    0.5, // restitutions
    velocityA,
    velocityB,
    false,
    false // not static
  );

  // After collision, A should slow down and B should speed up
  expect(resolution.newVelocityA.x).toBeLessThan(10);
  expect(resolution.newVelocityB.x).toBeGreaterThan(-5);

  // Separation should move A left and B right
  expect(resolution.separationA.x).toBeLessThan(0);
  expect(resolution.separationB.x).toBeGreaterThan(0);
});

test('resolveCollision handles static collision', () => {
  const collision = {
    entityA: 1,
    entityB: 2,
    normal: { x: -1, y: 0 },
    penetration: 5,
    contactPoint: { x: 15, y: 10 },
    timestamp: Date.now(),
  };

  const velocityA = { x: 10, y: 0 };
  const velocityB = { x: 0, y: 0 };

  const resolution = resolveCollision(
    collision,
    1.0,
    1.0,
    0.5,
    0.5,
    velocityA,
    velocityB,
    false,
    true // B is static
  );

  // A should bounce off static B
  expect(resolution.newVelocityA.x).toBeLessThan(0);
  expect(resolution.newVelocityB.x).toBe(0);

  // Only A should be separated
  expect(resolution.separationA.x).toBeLessThan(0);
  expect(resolution.separationB.x).toBe(0);
  expect(resolution.separationB.y).toBe(0);
});

test('isPointInBox detects point inside box', () => {
  const point = { x: 15, y: 15 };
  const box: BoundingBox = { x: 10, y: 10, width: 20, height: 20 };

  expect(isPointInBox(point, box)).toBe(true);
});

test('isPointInBox detects point outside box', () => {
  const point = { x: 5, y: 5 };
  const box: BoundingBox = { x: 10, y: 10, width: 20, height: 20 };

  expect(isPointInBox(point, box)).toBe(false);
});

test('isPointInBox detects point on box edge', () => {
  const point = { x: 10, y: 15 };
  const box: BoundingBox = { x: 10, y: 10, width: 20, height: 20 };

  expect(isPointInBox(point, box)).toBe(true);
});

test('getBoxCenter calculates center correctly', () => {
  const box: BoundingBox = { x: 10, y: 20, width: 30, height: 40 };
  const center = getBoxCenter(box);

  expect(center.x).toBe(25); // 10 + 30/2
  expect(center.y).toBe(40); // 20 + 40/2
});

test('getBoxCorners returns all four corners', () => {
  const box: BoundingBox = { x: 10, y: 20, width: 30, height: 40 };
  const corners = getBoxCorners(box);

  expect(corners).toHaveLength(4);
  expect(corners[0]).toEqual({ x: 10, y: 20 }); // Top-left
  expect(corners[1]).toEqual({ x: 40, y: 20 }); // Top-right
  expect(corners[2]).toEqual({ x: 40, y: 60 }); // Bottom-right
  expect(corners[3]).toEqual({ x: 10, y: 60 }); // Bottom-left
});
