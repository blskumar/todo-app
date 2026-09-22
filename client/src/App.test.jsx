import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { api } from './api.js';

vi.mock('./api.js', () => ({
  api: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const todo = (over = {}) => ({
  id: '1',
  title: 'buy milk',
  done: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  ...over,
});

beforeEach(() => {
  vi.resetAllMocks();
  api.list.mockResolvedValue([]);
});

describe('App', () => {
  test('shows an empty state when there are no todos', async () => {
    render(<App />);
    expect(await screen.findByText(/nothing here yet/i)).toBeInTheDocument();
  });

  test('renders todos loaded from the API', async () => {
    api.list.mockResolvedValue([todo(), todo({ id: '2', title: 'walk dog', done: true })]);
    render(<App />);

    expect(await screen.findByText('buy milk')).toBeInTheDocument();
    expect(screen.getByText('walk dog')).toBeInTheDocument();
    expect(screen.getByText('1 remaining')).toBeInTheDocument();
  });

  test('adds a todo and clears the input', async () => {
    const user = userEvent.setup();
    api.create.mockResolvedValue(todo());
    render(<App />);
    await screen.findByText(/nothing here yet/i);

    const input = screen.getByLabelText(/new todo/i);
    await user.type(input, 'buy milk');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(api.create).toHaveBeenCalledWith('buy milk');
    expect(await screen.findByText('buy milk')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  test('does not submit a blank title', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText(/nothing here yet/i);

    await user.type(screen.getByLabelText(/new todo/i), '   ');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(api.create).not.toHaveBeenCalled();
  });

  test('toggles a todo as done', async () => {
    const user = userEvent.setup();
    api.list.mockResolvedValue([todo()]);
    api.update.mockResolvedValue(todo({ done: true }));
    render(<App />);

    await user.click(await screen.findByRole('checkbox'));

    expect(api.update).toHaveBeenCalledWith('1', { done: true });
    await waitFor(() => expect(screen.getByRole('checkbox')).toBeChecked());
    expect(screen.getByText('0 remaining')).toBeInTheDocument();
  });

  test('deletes a todo', async () => {
    const user = userEvent.setup();
    api.list.mockResolvedValue([todo()]);
    api.remove.mockResolvedValue(null);
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /delete buy milk/i }));

    expect(api.remove).toHaveBeenCalledWith('1');
    expect(await screen.findByText(/nothing here yet/i)).toBeInTheDocument();
  });

  test('surfaces API errors', async () => {
    api.list.mockRejectedValue(new Error('boom'));
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('boom');
  });
});
