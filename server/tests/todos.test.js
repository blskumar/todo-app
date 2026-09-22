import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createStore } from '../src/store.js';

const store = createStore();
const app = createApp({ store });

beforeEach(() => store.reset());

const addTodo = (title) => request(app).post('/api/todos').send({ title });

describe('GET /api/health', () => {
  test('reports ok', async () => {
    const res = await request(app).get('/api/health').expect(200);
    assert.deepEqual(res.body, { status: 'ok' });
  });
});

describe('GET /api/todos', () => {
  test('starts empty', async () => {
    const res = await request(app).get('/api/todos').expect(200);
    assert.deepEqual(res.body, []);
  });

  test('returns created todos', async () => {
    await addTodo('buy milk');
    await addTodo('walk dog');
    const res = await request(app).get('/api/todos').expect(200);
    assert.equal(res.body.length, 2);
    assert.deepEqual(res.body.map((t) => t.title), ['buy milk', 'walk dog']);
  });
});

describe('POST /api/todos', () => {
  test('creates a todo with defaults', async () => {
    const res = await addTodo('  buy milk  ').expect(201);
    assert.equal(res.body.title, 'buy milk');
    assert.equal(res.body.done, false);
    assert.ok(res.body.id);
    assert.ok(res.body.createdAt);
  });

  test('rejects a missing title', async () => {
    const res = await request(app).post('/api/todos').send({}).expect(400);
    assert.match(res.body.error, /title is required/);
  });

  test('rejects a blank title', async () => {
    await request(app).post('/api/todos').send({ title: '   ' }).expect(400);
  });
});

describe('PATCH /api/todos/:id', () => {
  test('toggles done', async () => {
    const { body: todo } = await addTodo('buy milk');
    const res = await request(app)
      .patch(`/api/todos/${todo.id}`)
      .send({ done: true })
      .expect(200);
    assert.equal(res.body.done, true);
    assert.equal(res.body.title, 'buy milk');
  });

  test('renames a todo', async () => {
    const { body: todo } = await addTodo('buy milk');
    const res = await request(app)
      .patch(`/api/todos/${todo.id}`)
      .send({ title: 'buy oat milk' })
      .expect(200);
    assert.equal(res.body.title, 'buy oat milk');
  });

  test('rejects a non-boolean done', async () => {
    const { body: todo } = await addTodo('buy milk');
    await request(app).patch(`/api/todos/${todo.id}`).send({ done: 'yes' }).expect(400);
  });

  test('rejects an empty patch', async () => {
    const { body: todo } = await addTodo('buy milk');
    await request(app).patch(`/api/todos/${todo.id}`).send({}).expect(400);
  });

  test('404s for an unknown id', async () => {
    await request(app).patch('/api/todos/nope').send({ done: true }).expect(404);
  });
});

describe('DELETE /api/todos/:id', () => {
  test('removes a todo', async () => {
    const { body: todo } = await addTodo('buy milk');
    await request(app).delete(`/api/todos/${todo.id}`).expect(204);
    const res = await request(app).get('/api/todos').expect(200);
    assert.deepEqual(res.body, []);
  });

  test('404s for an unknown id', async () => {
    await request(app).delete('/api/todos/nope').expect(404);
  });
});
