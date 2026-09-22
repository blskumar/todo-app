import express from 'express';
import cors from 'cors';
import { createStore } from './store.js';

function validateTitle(title) {
  if (typeof title !== 'string' || title.trim() === '') {
    return 'title is required and must be a non-empty string';
  }
  if (title.length > 200) return 'title must be 200 characters or fewer';
  return null;
}

export function createApp({ store = createStore() } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/todos', (_req, res) => {
    res.json(store.list());
  });

  app.post('/api/todos', (req, res) => {
    const { title } = req.body ?? {};
    const error = validateTitle(title);
    if (error) return res.status(400).json({ error });
    res.status(201).json(store.create({ title: title.trim() }));
  });

  app.get('/api/todos/:id', (req, res) => {
    const todo = store.get(req.params.id);
    if (!todo) return res.status(404).json({ error: 'todo not found' });
    res.json(todo);
  });

  app.patch('/api/todos/:id', (req, res) => {
    const { title, done } = req.body ?? {};

    if (title !== undefined) {
      const error = validateTitle(title);
      if (error) return res.status(400).json({ error });
    }
    if (done !== undefined && typeof done !== 'boolean') {
      return res.status(400).json({ error: 'done must be a boolean' });
    }
    if (title === undefined && done === undefined) {
      return res.status(400).json({ error: 'nothing to update' });
    }

    const updated = store.update(req.params.id, {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(done !== undefined ? { done } : {}),
    });
    if (!updated) return res.status(404).json({ error: 'todo not found' });
    res.json(updated);
  });

  app.delete('/api/todos/:id', (req, res) => {
    const removed = store.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: 'todo not found' });
    res.status(204).end();
  });

  // Fallbacks
  app.use((_req, res) => res.status(404).json({ error: 'route not found' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: err.message || 'internal error' });
  });

  return app;
}
