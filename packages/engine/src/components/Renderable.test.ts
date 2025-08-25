import { test, expect } from 'bun:test';
import { createRenderable } from './Renderable';

test('createRenderable creates default renderable', () => {
  const renderable = createRenderable();

  expect(renderable.type).toBe('Renderable');
  expect(renderable.shape).toBe('rectangle');
  expect(renderable.size.x).toBe(20);
  expect(renderable.size.y).toBe(20);
  expect(renderable.color).toBe('#ffffff');
  expect(renderable.opacity).toBe(1.0);
  expect(renderable.layer).toBe(0);
  expect(renderable.visible).toBe(true);
  expect(renderable.spriteUrl).toBeUndefined();
});

test('createRenderable creates circle renderable', () => {
  const renderable = createRenderable('circle', 30, 30, '#ff0000', 0.8, 5);

  expect(renderable.shape).toBe('circle');
  expect(renderable.size.x).toBe(30);
  expect(renderable.size.y).toBe(30);
  expect(renderable.color).toBe('#ff0000');
  expect(renderable.opacity).toBe(0.8);
  expect(renderable.layer).toBe(5);
  expect(renderable.visible).toBe(true);
});

test('createRenderable creates sprite renderable', () => {
  const renderable = createRenderable('sprite', 40, 50, '#00ff00');

  expect(renderable.shape).toBe('sprite');
  expect(renderable.size.x).toBe(40);
  expect(renderable.size.y).toBe(50);
  expect(renderable.color).toBe('#00ff00');
});

test('renderable properties can be modified', () => {
  const renderable = createRenderable();

  renderable.color = '#blue';
  renderable.opacity = 0.5;
  renderable.visible = false;
  renderable.layer = 10;
  renderable.spriteUrl = '/sprites/player.png';

  expect(renderable.color).toBe('#blue');
  expect(renderable.opacity).toBe(0.5);
  expect(renderable.visible).toBe(false);
  expect(renderable.layer).toBe(10);
  expect(renderable.spriteUrl).toBe('/sprites/player.png');
});
