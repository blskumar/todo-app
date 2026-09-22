import { randomUUID } from 'node:crypto';

/**
 * In-memory todo store. Swap this module for a DB-backed
 * implementation without touching the route layer.
 */
export function createStore() {
  let todos = [];

  return {
    list() {
      return todos;
    },

    get(id) {
      return todos.find((t) => t.id === id) ?? null;
    },

    create({ title }) {
      const todo = {
        id: randomUUID(),
        title,
        done: false,
        createdAt: new Date().toISOString(),
      };
      todos.push(todo);
      return todo;
    },

    update(id, patch) {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return null;
      if (patch.title !== undefined) todo.title = patch.title;
      if (patch.done !== undefined) todo.done = patch.done;
      return todo;
    },

    remove(id) {
      const before = todos.length;
      todos = todos.filter((t) => t.id !== id);
      return todos.length < before;
    },

    reset() {
      todos = [];
    },
  };
}
