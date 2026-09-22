import { useEffect, useState } from 'react';
import { api } from './api.js';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .list()
      .then(setTodos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    try {
      const created = await api.create(trimmed);
      setTodos((prev) => [...prev, created]);
      setTitle('');
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggle(todo) {
    try {
      const updated = await api.update(todo.id, { done: !todo.done });
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(todo) {
    try {
      await api.remove(todo.id);
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <main className="app">
      <h1>Todo List</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="new-todo" className="sr-only">
          New todo
        </label>
        <input
          id="new-todo"
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {error && <p role="alert" className="error">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : todos.length === 0 ? (
        <p className="empty">Nothing here yet. Add your first todo above.</p>
      ) : (
        <>
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id} className={todo.done ? 'done' : undefined}>
                <label>
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => toggle(todo)}
                  />
                  <span>{todo.title}</span>
                </label>
                <button
                  type="button"
                  aria-label={`Delete ${todo.title}`}
                  onClick={() => remove(todo)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <p className="count">{remaining} remaining</p>
        </>
      )}
    </main>
  );
}
