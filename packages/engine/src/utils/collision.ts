import type { Vector2 } from '../types';
import type { BoundingBox, Collision } from '../components/Collider';

export const checkAABBCollision = (
  boxA: BoundingBox,
  boxB: BoundingBox
): boolean => {
  return (
    boxA.x < boxB.x + boxB.width &&
    boxA.x + boxA.width > boxB.x &&
    boxA.y < boxB.y + boxB.height &&
    boxA.y + boxA.height > boxB.y
  );
};

export const getCollisionInfo = (
  entityAId: number,
  entityBId: number,
  boxA: BoundingBox,
  boxB: BoundingBox
): Collision | null => {
  if (!checkAABBCollision(boxA, boxB)) {
    return null;
  }

  // Calculate overlap on both axes
  const overlapX =
    Math.min(boxA.x + boxA.width, boxB.x + boxB.width) -
    Math.max(boxA.x, boxB.x);
  const overlapY =
    Math.min(boxA.y + boxA.height, boxB.y + boxB.height) -
    Math.max(boxA.y, boxB.y);

  // Find the axis with minimum penetration (separation axis)
  let normal: Vector2;
  let penetration: number;

  if (overlapX < overlapY) {
    // Separate on X-axis
    penetration = overlapX;
    if (boxA.x < boxB.x) {
      normal = { x: -1, y: 0 }; // A is to the left of B
    } else {
      normal = { x: 1, y: 0 }; // A is to the right of B
    }
  } else {
    // Separate on Y-axis
    penetration = overlapY;
    if (boxA.y < boxB.y) {
      normal = { x: 0, y: -1 }; // A is above B
    } else {
      normal = { x: 0, y: 1 }; // A is below B
    }
  }

  // Calculate contact point (center of overlap area)
  const contactPoint: Vector2 = {
    x: Math.max(boxA.x, boxB.x) + overlapX / 2,
    y: Math.max(boxA.y, boxB.y) + overlapY / 2,
  };

  return {
    entityA: entityAId,
    entityB: entityBId,
    normal,
    penetration,
    contactPoint,
    timestamp: Date.now(),
  };
};

export const updateBoundingBox = (
  boundingBox: BoundingBox,
  position: Vector2,
  size?: Vector2
): void => {
  if (size) {
    boundingBox.width = size.x;
    boundingBox.height = size.y;
  }

  // Center the bounding box on the position
  boundingBox.x = position.x - boundingBox.width / 2;
  boundingBox.y = position.y - boundingBox.height / 2;
};

export const resolveCollision = (
  collision: Collision,
  massA: number,
  massB: number,
  restitutionA: number,
  restitutionB: number,
  velocityA: Vector2,
  velocityB: Vector2,
  isStaticA: boolean,
  isStaticB: boolean
): {
  newVelocityA: Vector2;
  newVelocityB: Vector2;
  separationA: Vector2;
  separationB: Vector2;
} => {
  const { normal, penetration } = collision;

  // Calculate relative velocity
  const relativeVelocity: Vector2 = {
    x: velocityA.x - velocityB.x,
    y: velocityA.y - velocityB.y,
  };

  // Calculate relative velocity in collision normal direction
  const velocityAlongNormal =
    relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;

  // Don't resolve if velocities are separating
  if (velocityAlongNormal > 0) {
    return {
      newVelocityA: velocityA,
      newVelocityB: velocityB,
      separationA: { x: 0, y: 0 },
      separationB: { x: 0, y: 0 },
    };
  }

  // Calculate restitution
  const restitution = Math.min(restitutionA, restitutionB);

  // Calculate impulse scalar
  let impulseScalar = -(1 + restitution) * velocityAlongNormal;

  if (!isStaticA && !isStaticB) {
    impulseScalar /= 1 / massA + 1 / massB;
  } else if (isStaticA && !isStaticB) {
    impulseScalar /= 1 / massB;
  } else if (!isStaticA && isStaticB) {
    impulseScalar /= 1 / massA;
  } else {
    // Both static - no velocity change
    impulseScalar = 0;
  }

  // Apply impulse
  const impulse: Vector2 = {
    x: impulseScalar * normal.x,
    y: impulseScalar * normal.y,
  };

  let newVelocityA = velocityA;
  let newVelocityB = velocityB;

  if (!isStaticA) {
    newVelocityA = {
      x: velocityA.x + impulse.x / massA,
      y: velocityA.y + impulse.y / massA,
    };
  }

  if (!isStaticB) {
    newVelocityB = {
      x: velocityB.x - impulse.x / massB,
      y: velocityB.y - impulse.y / massB,
    };
  }

  // Calculate position separation to prevent overlap
  const separationAmount =
    penetration /
    (isStaticA && isStaticB
      ? 1
      : (isStaticA ? 1 : 1 / massA) + (isStaticB ? 1 : 1 / massB));

  let separationA: Vector2 = { x: 0, y: 0 };
  let separationB: Vector2 = { x: 0, y: 0 };

  if (!isStaticA) {
    const separationRatioA = isStaticB
      ? 1
      : 1 / massA / (1 / massA + 1 / massB);
    separationA = {
      x: normal.x * separationAmount * separationRatioA,
      y: normal.y * separationAmount * separationRatioA,
    };
  }

  if (!isStaticB) {
    const separationRatioB = isStaticA
      ? 1
      : 1 / massB / (1 / massA + 1 / massB);
    separationB = {
      x: -normal.x * separationAmount * separationRatioB,
      y: -normal.y * separationAmount * separationRatioB,
    };
  }

  return {
    newVelocityA,
    newVelocityB,
    separationA,
    separationB,
  };
};

export const isPointInBox = (point: Vector2, box: BoundingBox): boolean => {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
};

export const getBoxCenter = (box: BoundingBox): Vector2 => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

export const getBoxCorners = (box: BoundingBox): Vector2[] => [
  { x: box.x, y: box.y },
  { x: box.x + box.width, y: box.y },
  { x: box.x + box.width, y: box.y + box.height },
  { x: box.x, y: box.y + box.height },
];
